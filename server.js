import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { 
  getPlayerStats, 
  addPlayerStat, 
  getGoldPrices, 
  addGoldPrice, 
  getScrollPrices, 
  addScrollPrice, 
  getPlayers, 
  addPlayer, 
  getXpValues, 
  getMobValues,
  configureBigQuery,
  testBigQueryConnection,
  deletePlayer,
  deletePlayerStats,
  getUserByUsername,
  addUser,
  checkUserCredentials,
  getAllUsers,
  updateUser,
  deleteUserByUsername,
  deletePlayerStat,
  deleteGoldPrice
} from './bigquery-service.js';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

// Needed to emulate __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';
const JWT_EXPIRES_IN = '2h';

// Middleware to check JWT
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, async (err, user) => {
      if (err) return res.status(403).json({ error: 'Invalid token' });
      // Check if user is still active
      try {
        const dbUser = await getUserByUsername(user.username);
        if (!dbUser || dbUser.is_active === false) {
          return res.status(403).json({ error: 'User is not active' });
        }
      } catch (e) {
        return res.status(500).json({ error: 'User status check failed' });
      }
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// Setup Express
const app = express();
const port = 8080;

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Rate limiting: 5 pushes per 10 minutes, 15 per hour per IP
const pushLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  standardHeaders: true, // Return rate limit info in the RateLimit-* headers
  legacyHeaders: false, // Disable the X-RateLimit-* headers
  keyGenerator: (req) => req.ip, // Use IP address for limiting
});
const pushLimiterHourly = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15, // limit each IP to 15 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
});
// Global rate limiting: 100 pushes per hour across all IPs
const globalPushLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // limit total requests across all IPs
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: () => 'global', // All requests share the same key
});
// Helper to combine multiple limiters
function doubleRateLimit(...limiters) {
  return (req, res, next) => {
    let i = 0;
    function runLimiter(err) {
      if (err) return next(err);
      if (i >= limiters.length) return next();
      limiters[i++](req, res, runLimiter);
    }
    runLimiter();
  };
}

// --- Initialize BigQuery Configuration ---
async function initBigQuery() {
  try {
    // Test the connection
    const connectionTest = await testBigQueryConnection();
    if (!connectionTest) {
      throw new Error('Failed to connect to BigQuery. Please check your configuration in bigquery-config.js');
    }
    
    console.log('✅ BigQuery initialized successfully');
  } catch (error) {
    console.error('❌ BigQuery initialization failed:', error);
    throw error;
  }
}

// --- API Endpoints (updated to use BigQuery) ---

// GET route: Get player stats for charts (optionally filtered by player)
app.get('/api/player-stats', async (req, res) => {
  try {
    const playerName = req.query.player;
    const stats = await getPlayerStats(playerName);
    res.json(stats);
  } catch (error) {
    console.error('❌ Error in /api/player-stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET route: Get scroll prices for charts
app.get('/api/scroll-prices', async (req, res) => {
  try {
    const scrollPrices = await getScrollPrices();
    const allPrices = [];

    // Transform the data structure to include both gold and diamond prices
    Object.entries(scrollPrices).forEach(([type, prices]) => {
      // We need to combine gold and diamond entries by timestamp
      const timestamps = new Set([...prices.gold.map(entry => entry.dateTime), ...prices.diamond.map(entry => entry.dateTime)]);

      timestamps.forEach(timestamp => {
        const goldEntry = prices.gold.find(entry => entry.dateTime === timestamp);
        const diamondEntry = prices.diamond.find(entry => entry.dateTime === timestamp);

        // Use .price for gold and diamond entries as per db structure
        allPrices.push({
          type,
          goldPrice: goldEntry ? goldEntry.price : null,
          diamondPrice: diamondEntry ? diamondEntry.price : null,
          timestamp: timestamp
        });
      });
    });

    // Sort by timestamp
    const sortedPrices = allPrices.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    res.json(sortedPrices);
  } catch (error) {
    console.error('❌ Error in /api/scroll-prices:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET route: Get gold prices for charts
app.get('/api/gold-prices', async (req, res) => {
  try {
    const prices = await getGoldPrices();
    res.json(prices);
  } catch (error) {
    console.error('❌ Error in /api/gold-prices:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET route: Get all players
app.get('/api/players', async (req, res) => {
  try {
    const players = await getPlayers();
    res.json(players);
  } catch (error) {
    console.error('❌ Error in /api/players:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST route: Add stat
app.post('/api/addStat', doubleRateLimit(globalPushLimiter, pushLimiter, pushLimiterHourly), async (req, res) => {
  try {
    console.log('Received request body:', req.body);

    const { player, exp, mobsKilled, gold } = req.body;

    // Validate required fields
    if (!player || exp === undefined || mobsKilled === undefined || gold === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const entry = {
      player,
      exp: Number(exp),
      mobsKilled: Number(mobsKilled),
      gold: Number(gold),
      dateTime: new Date().toISOString()
    };

    console.log('Adding entry:', entry);

    const result = await addPlayerStat(entry);

    console.log('✅ Stats added successfully');
    res.json(result);

  } catch (error) {
    console.error('❌ Error in /api/addStat:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST route: Add gold price
app.post('/api/addGoldPrice', doubleRateLimit(globalPushLimiter, pushLimiter, pushLimiterHourly), async (req, res) => {
  try {
    const { price } = req.body;

    if (price === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Price is required'
      });
    }

    const result = await addGoldPrice(price);

    console.log('✅ Gold price added successfully');
    res.json(result);

  } catch (error) {
    console.error('❌ Error in /api/addGoldPrice:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST route: Add scroll price
app.post('/api/addScrollPrice', doubleRateLimit(globalPushLimiter, pushLimiter, pushLimiterHourly), async (req, res) => {
  try {
    const { scrollType, goldPrice, diamondPrice } = req.body;

    if (!scrollType || goldPrice === undefined || diamondPrice === undefined) {
        return res.status(400).json({
            success: false,
            error: 'Missing required scroll price fields'
        });
    }

    const result = await addScrollPrice(scrollType, goldPrice, diamondPrice);

    console.log(`✅ ${scrollType} scroll price added successfully`);
    res.json(result);

  } catch (error) {
    console.error('❌ Error in /api/addScrollPrice:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST route: Add player
app.post('/api/addPlayer', doubleRateLimit(globalPushLimiter, pushLimiter, pushLimiterHourly), async (req, res) => {
  try {
    const { player } = req.body;

    if (!player) {
      return res.status(400).json({
        success: false,
        error: 'Player name is required'
      });
    }

    const result = await addPlayer(player);

    console.log('✅ Player added successfully');
    res.json(result);

  } catch (error) {
    console.error('❌ Error in /api/addPlayer:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET route: Test endpoint
app.get('/api/test', async (req, res) => {
    try {
        const playerStats = await getPlayerStats();
        const goldPrices = await getGoldPrices();
        const scrollPrices = await getScrollPrices();
        const players = await getPlayers();

        const scrollPriceCount = Object.keys(scrollPrices).reduce((sum, key) => 
            sum + scrollPrices[key].gold.length + scrollPrices[key].diamond.length, 0);

        res.json({
          status: 'Server is running',
          dbSize: {
            playerStats: playerStats.length,
            goldPrices: goldPrices.length,
            scrollPrices: scrollPriceCount,
            players: players.length
          }
        });
    } catch (error) {
        console.error('❌ Error in /api/test:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve XP values (DEPRECATED: use /api/levels instead)
app.get('/api/xp-values', async (req, res) => {
    try {
        const xpValues = await getXpValues();
        res.json({ levels: xpValues });
    } catch (error) {
        console.error('Error reading XP values:', error);
        res.status(500).json({ error: 'Failed to read XP values' });
    }
});

// Serve Levels (XP values) for the levels page
app.get('/api/levels', async (req, res) => {
    try {
        const xpValues = await getXpValues();
        res.json({ levels: xpValues });
    } catch (error) {
        console.error('Error reading Levels:', error);
        res.status(500).json({ error: 'Failed to read Levels' });
    }
});

// Serve Mob Values
app.get('/api/mob-values', async (req, res) => {
    try {
        const mobValues = await getMobValues();
        // Transform 'demonic' to 'demoniac' in questGold and questExp for each monster
        const transformed = mobValues.map(monster => {
            const newMonster = { ...monster };
            if (newMonster.questGold && newMonster.questGold.demonic !== undefined) {
                newMonster.questGold = { ...newMonster.questGold, demoniac: newMonster.questGold.demonic };
                delete newMonster.questGold.demonic;
            }
            if (newMonster.questExp && newMonster.questExp.demonic !== undefined) {
                newMonster.questExp = { ...newMonster.questExp, demoniac: newMonster.questExp.demonic };
                delete newMonster.questExp.demonic;
            }
            return newMonster;
        });
        res.json({ monsters: transformed });
    } catch (error) {
        console.error('Error reading mob values:', error);
        res.status(500).json({ error: 'Failed to read mob values' });
    }
});

// Login endpoint
app.post('/api/login', express.json(), async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await checkUserCredentials(username, password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials or inactive user' });
    if (user.is_active === false) return res.status(403).json({ error: 'User is not active' });
    const token = jwt.sign({ username: user.username, is_admin: user.is_admin, is_active: user.is_active }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Registration endpoint (admin only)
app.post('/api/register', express.json(), authenticateJWT, async (req, res) => {
  if (!req.user || !req.user.is_admin) return res.status(403).json({ error: 'Forbidden' });
  const { username, password, is_admin = false, is_active = true } = req.body;
  try {
    const result = await addUser({ username, password, is_admin, is_active });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- Admin User Management Endpoints ---
app.get('/api/users', authenticateJWT, async (req, res) => {
  if (!req.user || !req.user.is_admin) return res.status(403).json({ error: 'Forbidden' });
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/update', authenticateJWT, async (req, res) => {
  if (!req.user || !req.user.is_admin) return res.status(403).json({ error: 'Forbidden' });
  const { username, is_admin, is_active } = req.body;
  try {
    await updateUser({ username, is_admin, is_active });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/users/delete', authenticateJWT, async (req, res) => {
  if (!req.user || !req.user.is_admin) return res.status(403).json({ error: 'Forbidden' });
  const { username } = req.body;
  try {
    await deleteUserByUsername(username);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST route: Delete player stat by player and dateTime
app.post('/api/player-stats/delete', authenticateJWT, async (req, res) => {
  if (!req.user || !req.user.is_admin) return res.status(403).json({ error: 'Forbidden' });
  const { player, dateTime } = req.body;
  try {
    await deletePlayerStat(player, dateTime);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE route: Delete gold price by dateTime and price
app.post('/api/gold-prices/delete', authenticateJWT, async (req, res) => {
  const { dateTime, price } = req.body;
  if (!dateTime || price === undefined) return res.status(400).json({ success: false, error: 'dateTime and price are required' });
  try {
    await deleteGoldPrice(dateTime, price);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST route: Delete player
app.post('/api/deletePlayer', authenticateJWT, async (req, res) => {
  try {
    const { player } = req.body;
    if (!player) {
      return res.status(400).json({ success: false, error: 'Player name is required' });
    }
    // Only allow admin users
    if (!req.user || !req.user.is_admin) {
      return res.status(403).json({ success: false, error: 'Admin privileges required' });
    }
    await deletePlayer(player);
    await deletePlayerStats(player);
    res.json({ success: true, player });
  } catch (error) {
    console.error('❌ Error in /api/deletePlayer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Protect all API routes except login and registration
app.use((req, res, next) => {
  if (
    req.path.startsWith('/api/login') ||
    (req.path.startsWith('/api/register') && req.method === 'POST') ||
    req.path.startsWith('/public') ||
    req.path === '/' ||
    req.path.endsWith('.js') ||
    req.path.endsWith('.css') ||
    req.path.endsWith('.ico') ||
    req.path.endsWith('.png') ||
    req.path.endsWith('.html')
  ) {
    return next();
  }
  authenticateJWT(req, res, next);
});

// Initialize DB and start server
initBigQuery().then(() => {
  app.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}`);
  });
}).catch(err => {
  console.error('❌ Failed to initialize BigQuery or start server:', err);
});