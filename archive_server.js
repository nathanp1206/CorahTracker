import express from 'express';
import path from 'path';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';

// Needed to emulate __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup Express
const app = express();
const port = 3000;

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Setup lowdb
const data = { goldPrices: [], stats: [] }
const dbFile = path.join(__dirname, 'db.json'); // ✅ make sure this file path is correct
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, data);

// Use an IIFE to initialize async logic
(async () => {
  await db.read();
  db.data ||= { stats: [], goldPrices: [] };
  await db.write();

  // POST route: Add stat
  app.post('/api/addStat', async (req, res) => {
    const { player, exp, mobsKilled, gold } = req.body;
    
    // Ensure db.data exists and has stats array
    if (!db.data) {
        db.data = { stats: [] };
    }
    if (!db.data.stats) {
        db.data.stats = [];
    }
    
    const entry = {
        player,
        exp: Number(exp),
        mobsKilled: Number(mobsKilled),
        gold: Number(gold),
        dateTime: new Date().toISOString()
    };
    
    db.data.stats.push(entry);
    await db.write();
    res.json({ success: true, entry });
    });

  // POST route: Add gold price
  app.post('/api/addGoldPrice', async (req, res) => {
    const { price } = req.body;
    const entry = {
      price: Number(price),
      dateTime: new Date().toISOString()
    };
    db.data.goldPrices.push(entry);
    await db.write();
    res.json({ success: true, entry });
  });

  // Start server
  app.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}`);
  });
})();
