import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const oldDbPath = path.join(__dirname, 'db', 'db.json');
const playerStatsPath = path.join(__dirname, 'db', 'playerStats.json');
const goldPricesPath = path.join(__dirname, 'db', 'goldPrices.json');
const scrollPricesPath = path.join(__dirname, 'db', 'scrollPrices.json');
const playersPath = path.join(__dirname, 'db', 'players.json');

async function migrateData() {
  console.log('Starting data migration...');

  // 1. Read old db.json
  let oldData = {};
  try {
    const oldDbContent = await fs.promises.readFile(oldDbPath, 'utf-8');
    oldData = JSON.parse(oldDbContent);
    console.log('✅ Read data from old db.json');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn('⚠️ old db/db.json not found. Skipping data migration.');
      return; // Exit if the old file doesn't exist
    }
    console.error('❌ Error reading old db.json:', error);
    process.exit(1); // Exit on other errors
  }

  // Ensure new files exist with default structure if they were just created by the server
  const defaultPlayerStats = { stats: [] };
  const defaultGoldPrices = { goldPrices: [] };
  const defaultScrollPrices = { scrollPrices: { ancient: { gold: [], diamond: [] }, demoniac: { gold: [], diamond: [] }, arcane: { gold: [], diamond: [] }, shadow: { gold: [], diamond: [] }, void: { gold: [], diamond: [] }, sunlight: { gold: [], diamond: [] } } };
  const defaultPlayers = { players: [] }; // Start with empty for players, as we'll copy from oldData

  let playerStatsData = defaultPlayerStats;
  let goldPricesData = defaultGoldPrices;
  let scrollPricesData = defaultScrollPrices;
  let playersData = defaultPlayers;

  try {
      if (fs.existsSync(playerStatsPath)) playerStatsData = JSON.parse(await fs.promises.readFile(playerStatsPath, 'utf-8'));
      if (fs.existsSync(goldPricesPath)) goldPricesData = JSON.parse(await fs.promises.readFile(goldPricesPath, 'utf-8'));
      if (fs.existsSync(scrollPricesPath)) scrollPricesData = JSON.parse(await fs.promises.readFile(scrollPricesPath, 'utf-8'));
      if (fs.existsSync(playersPath)) playersData = JSON.parse(await fs.promises.readFile(playersPath, 'utf-8'));
      console.log('✅ Read data from new JSON files');
  } catch (error) {
      console.error('❌ Error reading new JSON files:', error);
      process.exit(1);
  }


  // 2. Copy data from oldData to newData (merge with existing if any)
  if (oldData.stats && oldData.stats.length > 0) {
    // For stats, just overwrite the default empty array
    playerStatsData.stats = oldData.stats;
    console.log(`✅ Copied ${oldData.stats.length} player stats.`);
  } else {
     console.log('ℹ️ No player stats found in old db.json to copy.');
  }

  if (oldData.goldPrices && oldData.goldPrices.length > 0) {
     // For gold prices, overwrite the default
     goldPricesData.goldPrices = oldData.goldPrices;
     console.log(`✅ Copied ${oldData.goldPrices.length} gold prices.`);
  } else {
     console.log('ℹ️ No gold prices found in old db.json to copy.');
  }

  if (oldData.scrollPrices) {
    let scrollPriceCount = 0;
    // Merge scroll prices by type
    Object.entries(oldData.scrollPrices).forEach(([type, prices]) => {
        if (prices.gold && prices.gold.length > 0) {
            // Overwrite gold prices for this type
            scrollPricesData.scrollPrices[type].gold = prices.gold;
            scrollPriceCount += prices.gold.length;
        }
         if (prices.diamond && prices.diamond.length > 0) {
            // Overwrite diamond prices for this type
            scrollPricesData.scrollPrices[type].diamond = prices.diamond;
            scrollPriceCount += prices.diamond.length;
        }
    });
    if (scrollPriceCount > 0) {
        console.log(`✅ Copied ${scrollPriceCount} scroll price entries.`);
    } else {
        console.log('ℹ️ No scroll prices found in old db.json to copy.');
    }
  } else {
    console.log('ℹ️ No scroll prices found in old db.json to copy.');
  }


  if (oldData.players && oldData.players.length > 0) {
    // For players, use the list from the old database
    playersData.players = oldData.players;
    console.log(`✅ Copied ${oldData.players.length} players.`);
  } else {
     // If no players in old db, keep the default ones defined in server.js (or an empty array if you prefer)
     console.log('ℹ️ No players found in old db.json to copy. Keeping default players if any.');
     // You might want to set playersData.players = defaultPlayers.players here if you want to ensure the defaults from server.js are definitely included.
  }


  // 3. Write data to new JSON files
  try {
    await fs.promises.writeFile(playerStatsPath, JSON.stringify(playerStatsData, null, 2), 'utf-8');
    await fs.promises.writeFile(goldPricesPath, JSON.stringify(goldPricesData, null, 2), 'utf-8');
    await fs.promises.writeFile(scrollPricesPath, JSON.stringify(scrollPricesData, null, 2), 'utf-8');
    await fs.promises.writeFile(playersPath, JSON.stringify(playersData, null, 2), 'utf-8');
    console.log('✅ Successfully wrote data to new JSON files.');
    console.log('Data migration complete.');

    // Optional: Remove the old db.json file after successful migration
    // await fs.promises.unlink(oldDbPath);
    // console.log('✅ Removed old db.json');

  } catch (error) {
    console.error('❌ Error writing to new JSON files:', error);
    process.exit(1);
  }
}

migrateData();