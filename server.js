import express from 'express';
import path from 'path';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Needed to emulate __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup Express
const app = express();
const port = 8080;

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// --- Setup separate lowdb instances ---

// Player Stats Database
const playerStatsFile = path.join(__dirname, 'db/playerStats.json');
const playerStatsAdapter = new JSONFile(playerStatsFile);
const defaultPlayerStats = { stats: [] };
const playerStatsDb = new Low(playerStatsAdapter, defaultPlayerStats);

// Gold Prices Database
const goldPricesFile = path.join(__dirname, 'db/goldPrices.json');
const goldPricesAdapter = new JSONFile(goldPricesFile);
const defaultGoldPrices = { goldPrices: [] };
const goldPricesDb = new Low(goldPricesAdapter, defaultGoldPrices);

// Scroll Prices Database
const scrollPricesFile = path.join(__dirname, 'db/scrollPrices.json');
const scrollPricesAdapter = new JSONFile(scrollPricesFile);
const defaultScrollPrices = {
  scrollPrices: {
    ancient: { gold: [], diamond: [] },
    demoniac: { gold: [], diamond: [] },
    arcane: { gold: [], diamond: [] },
    shadow: { gold: [], diamond: [] },
    void: { gold: [], diamond: [] },
    sunlight: { gold: [], diamond: [] }
  }
};
const scrollPricesDb = new Low(scrollPricesAdapter, defaultScrollPrices);

// Players Database
const playersFile = path.join(__dirname, 'db/players.json');
const playersAdapter = new JSONFile(playersFile);
const defaultPlayers = { players: ["Hunt3r1206", "Kahuku", "Gigalogic", "Sinolos"] }; // Keep initial players
const playersDb = new Low(playersAdapter, defaultPlayers);

// --- Initialize databases ---
async function initDB() {
  await playerStatsDb.read();
  playerStatsDb.data = Object.assign({}, defaultPlayerStats, playerStatsDb.data);
  await playerStatsDb.write();

  await goldPricesDb.read();
  goldPricesDb.data = Object.assign({}, defaultGoldPrices, goldPricesDb.data);
  await goldPricesDb.write();

  await scrollPricesDb.read();
  scrollPricesDb.data = Object.assign({}, defaultScrollPrices, scrollPricesDb.data);
  await scrollPricesDb.write();

  await playersDb.read();
  playersDb.data = Object.assign({}, defaultPlayers, playersDb.data);
  await playersDb.write();

  console.log('✅ All databases initialized');
}

// --- API Endpoints (updated to use separate databases) ---

// GET route: Get player stats for charts (optionally filtered by player)
app.get('/api/player-stats', async (req, res) => {
  try {
    await playerStatsDb.read(); // Ensure latest data is read
    const playerName = req.query.player;
    let stats = playerStatsDb.data.stats || [];

    if (playerName) {
      stats = stats.filter(entry => entry.player === playerName);
    }

    // Sort by dateTime to ensure chronological order
    const sortedStats = stats.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    res.json(sortedStats);
  } catch (error) {
    console.error('❌ Error in /api/player-stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET route: Get scroll prices for charts
app.get('/api/scroll-prices', async (req, res) => {
  try {
    await scrollPricesDb.read(); // Ensure latest data is read
    const scrollPrices = scrollPricesDb.data.scrollPrices || defaultScrollPrices.scrollPrices;
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
    await goldPricesDb.read(); // Ensure latest data is read
    const prices = goldPricesDb.data.goldPrices || [];
    // Sort by dateTime to ensure chronological order
    const sortedPrices = prices.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    res.json(sortedPrices);
  } catch (error) {
    console.error('❌ Error in /api/gold-prices:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET route: Get all players
app.get('/api/players', async (req, res) => {
  try {
    await playersDb.read(); // Ensure latest data is read
    const players = playersDb.data.players || [];
    res.json(players);
  } catch (error) {
    console.error('❌ Error in /api/players:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST route: Add stat
app.post('/api/addStat', async (req, res) => {
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

    await playerStatsDb.read(); // Ensure latest data is read before push

    // Ensure stats array exists
    if (!playerStatsDb.data.stats) {
      playerStatsDb.data.stats = [];
    }

    const entry = {
      player,
      exp: Number(exp),
      mobsKilled: Number(mobsKilled),
      gold: Number(gold),
      dateTime: new Date().toISOString()
    };

    console.log('Adding entry:', entry);

    playerStatsDb.data.stats.push(entry);
    await playerStatsDb.write();

    // Add player to players list if not already present (using playersDb)
    await playersDb.read(); // Ensure latest data is read before checking
    if (!playersDb.data.players.includes(player)) {
      playersDb.data.players.push(player);
      await playersDb.write();
    }

    console.log('✅ Stats added successfully');
    res.json({ success: true, entry });

  } catch (error) {
    console.error('❌ Error in /api/addStat:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST route: Add gold price
app.post('/api/addGoldPrice', async (req, res) => {
  try {
    const { price } = req.body;

    if (price === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Price is required'
      });
    }

    await goldPricesDb.read(); // Ensure latest data is read before push

    // Ensure goldPrices array exists
    if (!goldPricesDb.data.goldPrices) {
      goldPricesDb.data.goldPrices = [];
    }

    const timestamp = new Date().toISOString();
    const entry = {
      price: Number(price),
      dateTime: timestamp
    };

    goldPricesDb.data.goldPrices.push(entry);
    await goldPricesDb.write();

    console.log('✅ Gold price added successfully');
    res.json({ success: true, entry });

  } catch (error) {
    console.error('❌ Error in /api/addGoldPrice:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST route: Add scroll price
app.post('/api/addScrollPrice', async (req, res) => {
  try {
    const { scrollType, goldPrice, diamondPrice } = req.body;

    if (!scrollType || goldPrice === undefined || diamondPrice === undefined) {
        return res.status(400).json({
            success: false,
            error: 'Missing required scroll price fields'
        });
    }

    await scrollPricesDb.read(); // Ensure latest data is read before push

    if (!scrollPricesDb.data.scrollPrices[scrollType]) {
        scrollPricesDb.data.scrollPrices[scrollType] = { gold: [], diamond: [] };
    }

    const timestamp = new Date().toISOString();

    // Add gold price entry
    scrollPricesDb.data.scrollPrices[scrollType].gold.push({
        price: Number(goldPrice),
        dateTime: timestamp
    });

    // Add diamond price entry
    scrollPricesDb.data.scrollPrices[scrollType].diamond.push({
        price: Number(diamondPrice),
        dateTime: timestamp
    });

    await scrollPricesDb.write();

    console.log(`✅ ${scrollType} scroll price added successfully`);
    res.json({
      success: true,
      entry: {
        scrollType,
        goldPrice: Number(goldPrice),
        diamondPrice: Number(diamondPrice),
        dateTime: timestamp
      }
    });

  } catch (error) {
    console.error('❌ Error in /api/addScrollPrice:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST route: Add player
app.post('/api/addPlayer', async (req, res) => {
  try {
    const { player } = req.body;

    if (!player) {
      return res.status(400).json({
        success: false,
        error: 'Player name is required'
      });
    }

    await playersDb.read(); // Ensure latest data is read before push

    // Check if player already exists
    if (playersDb.data.players.includes(player)) {
      return res.status(400).json({
        success: false,
        error: 'Player already exists'
      });
    }

    // Add new player
    playersDb.data.players.push(player);
    await playersDb.write();

    console.log('✅ Player added successfully');
    res.json({ success: true, player });

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
    await playerStatsDb.read();
    await goldPricesDb.read();
    await scrollPricesDb.read();
    await playersDb.read();

    const scrollPriceCount = Object.keys(scrollPricesDb.data.scrollPrices).reduce((sum, key) => sum + scrollPricesDb.data.scrollPrices[key].gold.length + scrollPricesDb.data.scrollPrices[key].diamond.length, 0);

    res.json({
      status: 'Server is running',
      dbSize: {
        playerStats: playerStatsDb.data.stats.length,
        goldPrices: goldPricesDb.data.goldPrices.length,
        scrollPrices: scrollPriceCount,
        players: playersDb.data.players.length
      }
    });
});

// Serve XP values (DEPRECATED: use /api/levels instead)
app.get('/api/xp-values', (req, res) => {
    try {
        const xpValues = JSON.parse(fs.readFileSync(path.join(__dirname, 'db', 'xpValues.json'), 'utf8'));
        res.json(xpValues);
    } catch (error) {
        console.error('Error reading XP values:', error);
        res.status(500).json({ error: 'Failed to read XP values' });
    }
});

// Serve Levels (XP values) for the levels page
app.get('/api/levels', (req, res) => {
    try {
        const xpValues = JSON.parse(fs.readFileSync(path.join(__dirname, 'db', 'xpValues.json'), 'utf8'));
        res.json(xpValues);
    } catch (error) {
        console.error('Error reading Levels:', error);
        res.status(500).json({ error: 'Failed to read Levels' });
    }
});

// Serve Mob Values
app.get('/api/mob-values', (req, res) => {
    try {
        const mobValues = JSON.parse(fs.readFileSync(path.join(__dirname, 'db', 'mobValues.json'), 'utf8'));
        res.json(mobValues);
    } catch (error) {
        console.error('Error reading mob values:', error);
        res.status(500).json({ error: 'Failed to read mob values' });
    }
});

// Initialize DB and start server
initDB().then(() => {
  app.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}`);
  });
}).catch(err => {
  console.error('❌ Failed to initialize databases or start server:', err);
});