import { BigQuery } from '@google-cloud/bigquery';
import { bigqueryConfig } from './bigquery-config.js';
import bcrypt from 'bcryptjs';

// BigQuery configuration
const bigquery = new BigQuery({
  projectId: bigqueryConfig.projectId,
  keyFilename: bigqueryConfig.keyFilename
});

// Configuration object - you'll need to update these with your actual values
const config = {
  projectId: 'YOUR_PROJECT_ID', // Replace with your actual project ID
  datasetId: 'YOUR_DATASET_ID', // Replace with your actual dataset ID
  tables: {
    playerStats: 'player_stats', // Replace with your actual table name
    goldPrices: 'gold_prices',   // Replace with your actual table name
    scrollPrices: 'scroll_prices', // Replace with your actual table name
    players: 'players',          // Replace with your actual table name
    xpValues: 'xp_values',       // Replace with your actual table name
    mobValues: 'mob_values'      // Replace with your actual table name
  }
};

// Helper function to get fully qualified table name
function getTableName(tableKey) {
  return `${bigqueryConfig.projectId}.${bigqueryConfig.datasetId}.${bigqueryConfig.tables[tableKey]}`;
}

// Player Stats Operations
export async function getPlayerStats(playerName = null) {
  try {
    let query = `SELECT stats.* FROM \`${getTableName('playerStats')}\`, UNNEST(stats) as stats`;
    if (playerName) {
      query += ` WHERE stats.player = @playerName`;
    }
    query += ` ORDER BY stats.dateTime ASC`;

    const options = {
      query: query,
      params: playerName ? { playerName } : {},
      location: bigqueryConfig.location
    };

    const [rows] = await bigquery.query(options);
    
    // Convert BigQuery timestamp objects to ISO strings for frontend compatibility
    return rows.map(row => ({
      ...row,
      dateTime: row.dateTime?.value || row.dateTime
    }));
  } catch (error) {
    console.error('Error fetching player stats from BigQuery:', error);
    throw error;
  }
}

export async function addPlayerStat(stat) {
  try {
    // For nested arrays, we need to use ARRAY_CONCAT to append to the existing array
    const query = `
      UPDATE \`${getTableName('playerStats')}\`
      SET stats = ARRAY_CONCAT(
        COALESCE(stats, []),
        [STRUCT(
          TIMESTAMP(@dateTime) as dateTime,
          @gold as gold,
          @exp as exp,
          @mobsKilled as mobsKilled,
          @player as player
        )]
      )
      WHERE TRUE
    `;

    const options = {
      query: query,
      params: {
        player: stat.player,
        exp: Number(stat.exp),
        mobsKilled: Number(stat.mobsKilled),
        gold: Number(stat.gold),
        dateTime: stat.dateTime || new Date().toISOString()
      },
      location: bigqueryConfig.location
    };

    await bigquery.query(options);
    return { success: true, entry: stat };
  } catch (error) {
    console.error('Error adding player stat to BigQuery:', error);
    throw error;
  }
}

// Gold Prices Operations
export async function getGoldPrices() {
  try {
    const query = `SELECT goldPrices.* FROM \`${getTableName('goldPrices')}\`, UNNEST(goldPrices) as goldPrices ORDER BY goldPrices.dateTime ASC`;
    
    const options = {
      query: query,
      location: bigqueryConfig.location
    };

    const [rows] = await bigquery.query(options);
    
    // Convert BigQuery timestamp objects to ISO strings for frontend compatibility
    return rows.map(row => ({
      ...row,
      dateTime: row.dateTime?.value || row.dateTime
    }));
  } catch (error) {
    console.error('Error fetching gold prices from BigQuery:', error);
    throw error;
  }
}

export async function addGoldPrice(price) {
  try {
    const query = `
      UPDATE \`${getTableName('goldPrices')}\`
      SET goldPrices = ARRAY_CONCAT(
        COALESCE(goldPrices, []),
        [STRUCT(
          TIMESTAMP(@dateTime) as dateTime,
          @price as price
        )]
      )
      WHERE TRUE
    `;

    const options = {
      query: query,
      params: {
        price: Number(price),
        dateTime: new Date().toISOString()
      },
      location: bigqueryConfig.location
    };

    await bigquery.query(options);
    return { success: true, entry: { price: Number(price), dateTime: new Date().toISOString() } };
  } catch (error) {
    console.error('Error adding gold price to BigQuery:', error);
    throw error;
  }
}

// Scroll Prices Operations
export async function getScrollPrices() {
  try {
    const query = `SELECT scrollPrices FROM \`${getTableName('scrollPrices')}\``;
    
    const options = {
      query: query,
      location: bigqueryConfig.location
    };

    const [rows] = await bigquery.query(options);
    
    if (rows.length === 0) {
      return {
        ancient: { gold: [], diamond: [] },
        demoniac: { gold: [], diamond: [] },
        arcane: { gold: [], diamond: [] },
        shadow: { gold: [], diamond: [] },
        void: { gold: [], diamond: [] },
        sunlight: { gold: [], diamond: [] }
      };
    }

    // The scrollPrices is already in the correct nested structure
    const scrollPrices = rows[0].scrollPrices;
    
    // Convert BigQuery timestamp objects to ISO strings in the nested structure
    const convertedScrollPrices = {};
    Object.keys(scrollPrices).forEach(scrollType => {
      convertedScrollPrices[scrollType] = {
        gold: scrollPrices[scrollType].gold.map(item => ({
          ...item,
          dateTime: item.dateTime?.value || item.dateTime
        })),
        diamond: scrollPrices[scrollType].diamond.map(item => ({
          ...item,
          dateTime: item.dateTime?.value || item.dateTime
        }))
      };
    });
    
    return convertedScrollPrices;
  } catch (error) {
    console.error('Error fetching scroll prices from BigQuery:', error);
    throw error;
  }
}

export async function addScrollPrice(scrollType, goldPrice, diamondPrice) {
  try {
    // For nested scroll prices, we need to update the specific scroll type's arrays
    const query = `
      UPDATE \`${getTableName('scrollPrices')}\`
      SET scrollPrices.${scrollType}.gold = ARRAY_CONCAT(
        COALESCE(scrollPrices.${scrollType}.gold, []),
        [STRUCT(TIMESTAMP(@dateTime) as dateTime, @goldPrice as price)]
      ),
      scrollPrices.${scrollType}.diamond = ARRAY_CONCAT(
        COALESCE(scrollPrices.${scrollType}.diamond, []),
        [STRUCT(TIMESTAMP(@dateTime) as dateTime, @diamondPrice as price)]
      )
      WHERE TRUE
    `;

    const options = {
      query: query,
      params: {
        goldPrice: Number(goldPrice),
        diamondPrice: Number(diamondPrice),
        dateTime: new Date().toISOString()
      },
      location: bigqueryConfig.location
    };

    await bigquery.query(options);
    return { 
      success: true, 
      entry: {
        scrollType,
        goldPrice: Number(goldPrice),
        diamondPrice: Number(diamondPrice),
        dateTime: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error adding scroll price to BigQuery:', error);
    throw error;
  }
}

// Players Operations
export async function getPlayers() {
  try {
    const query = `SELECT players FROM \`${getTableName('players')}\``;
    
    const options = {
      query: query,
      location: bigqueryConfig.location
    };

    const [rows] = await bigquery.query(options);
    return rows.length > 0 ? rows[0].players : [];
  } catch (error) {
    console.error('Error fetching players from BigQuery:', error);
    throw error;
  }
}

export async function addPlayer(player) {
  try {
    // Check if player already exists
    const existingPlayers = await getPlayers();
    if (existingPlayers.includes(player)) {
      throw new Error('Player already exists');
    }

    const query = `
      UPDATE \`${getTableName('players')}\`
      SET players = ARRAY_CONCAT(
        COALESCE(players, []),
        [@player]
      )
      WHERE TRUE
    `;

    const options = {
      query: query,
      params: { player },
      location: bigqueryConfig.location
    };

    await bigquery.query(options);
    return { success: true, player };
  } catch (error) {
    console.error('Error adding player to BigQuery:', error);
    throw error;
  }
}

// XP Values Operations
export async function getXpValues() {
  try {
    const query = `SELECT levels.* FROM \`${getTableName('xpValues')}\`, UNNEST(levels) as levels ORDER BY levels.level ASC`;
    
    const options = {
      query: query,
      location: bigqueryConfig.location
    };

    const [rows] = await bigquery.query(options);
    return rows;
  } catch (error) {
    console.error('Error fetching XP values from BigQuery:', error);
    throw error;
  }
}

// Mob Values Operations
export async function getMobValues() {
  try {
    const query = `SELECT monsters.* FROM \`${getTableName('mobValues')}\`, UNNEST(monsters) as monsters ORDER BY monsters.name ASC`;
    
    const options = {
      query: query,
      location: bigqueryConfig.location
    };

    const [rows] = await bigquery.query(options);
    return rows;
  } catch (error) {
    console.error('Error fetching mob values from BigQuery:', error);
    throw error;
  }
}

// Configuration function - call this to update your BigQuery settings
export function configureBigQuery(projectId, datasetId, tableNames) {
  bigqueryConfig.projectId = projectId;
  bigqueryConfig.datasetId = datasetId;
  Object.assign(bigqueryConfig.tables, tableNames);
  console.log('BigQuery configuration updated:', bigqueryConfig);
}

// Test connection function
export async function testBigQueryConnection() {
  try {
    const query = `SELECT 1 as test`;
    const options = {
      query: query,
      location: bigqueryConfig.location
    };
    
    const [rows] = await bigquery.query(options);
    console.log('✅ BigQuery connection successful');
    return true;
  } catch (error) {
    console.error('❌ BigQuery connection failed:', error);
    return false;
  }
}

// Utility function to check table schemas
export async function checkTableSchema(tableKey) {
  try {
    const tableName = getTableName(tableKey);
    const query = `
      SELECT column_name, data_type, is_nullable
      FROM \`${bigqueryConfig.projectId}.${bigqueryConfig.datasetId}.INFORMATION_SCHEMA.COLUMNS\`
      WHERE table_name = @tableName
      ORDER BY ordinal_position
    `;
    
    const options = {
      query: query,
      params: { tableName: bigqueryConfig.tables[tableKey] },
      location: bigqueryConfig.location
    };
    
    const [rows] = await bigquery.query(options);
    console.log(`📋 Schema for ${tableKey} table:`, rows);
    return rows;
  } catch (error) {
    console.error(`❌ Error checking schema for ${tableKey}:`, error);
    throw error;
  }
}

// Function to check all table schemas
export async function checkAllTableSchemas() {
  console.log('🔍 Checking all table schemas...');
  for (const tableKey of Object.keys(bigqueryConfig.tables)) {
    try {
      await checkTableSchema(tableKey);
    } catch (error) {
      console.error(`Failed to check schema for ${tableKey}:`, error.message);
    }
  }
}

// Delete a player from the players array
export async function deletePlayer(player) {
  try {
    const query = `
      UPDATE \`${getTableName('players')}\`
      SET players = ARRAY(SELECT p FROM UNNEST(players) AS p WHERE p != @player)
      WHERE TRUE
    `;
    const options = {
      query: query,
      params: { player },
      location: bigqueryConfig.location
    };
    await bigquery.query(options);
    return { success: true, player };
  } catch (error) {
    console.error('Error deleting player from BigQuery:', error);
    throw error;
  }
}

// Delete all stats for a player from the playerStats table
export async function deletePlayerStats(player) {
  try {
    const query = `
      UPDATE \`${getTableName('playerStats')}\`
      SET stats = ARRAY(SELECT s FROM UNNEST(stats) AS s WHERE s.player != @player)
      WHERE TRUE
    `;
    const options = {
      query: query,
      params: { player },
      location: bigqueryConfig.location
    };
    await bigquery.query(options);
    return { success: true, player };
  } catch (error) {
    console.error('Error deleting player stats from BigQuery:', error);
    throw error;
  }
} 

// Update deletePlayerStat to delete by player and dateTime
export async function deletePlayerStat(player, dateTime) {
  try {
    const query = `
      UPDATE \`${getTableName('playerStats')}\`
      SET stats = ARRAY(
        SELECT s FROM UNNEST(stats) AS s
        WHERE NOT (
          s.player = @player
          AND s.dateTime IN (TIMESTAMP(@dateTime))
        )
      )
      WHERE EXISTS (
        SELECT 1 FROM UNNEST(stats) AS s
        WHERE s.player = @player
          AND s.dateTime IN (TIMESTAMP(@dateTime))
      )
    `;
    const options = {
      query: query,
      params: { player, dateTime },
      location: bigqueryConfig.location
    };
    await bigquery.query(options);
    return { success: true, player };
  } catch (error) {
    console.error('Error deleting player stat from BigQuery:', error);
    throw error;
  }
}

// Delete a gold price entry by dateTime and price (dateTime as string in DB format)
export async function deleteGoldPrice(dateTime, price) {
  try {
    const query = `
      UPDATE \`${getTableName('goldPrices')}\`
      SET goldPrices = ARRAY(
        SELECT g FROM UNNEST(goldPrices) AS g
        WHERE NOT (STRING(g.dateTime) = @dateTime AND ABS(g.price - @price) < 0.0001)
      )
      WHERE TRUE
    `;
    const options = {
      query: query,
      params: { dateTime, price: Number(price) },
      location: bigqueryConfig.location
    };
    await bigquery.query(options);
    return { success: true, dateTime, price };
  } catch (error) {
    console.error('Error deleting gold price from BigQuery:', error);
    throw error;
  }
}

// User Authentication Operations
export async function getUserByUsername(username) {
  try {
    const query = `SELECT * FROM \`${getTableName('users')}\` WHERE username = @username`;
    const options = {
      query,
      params: { username },
      location: bigqueryConfig.location
    };
    const [rows] = await bigquery.query(options);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error fetching user from BigQuery:', error);
    throw error;
  }
}

export async function addUser({ username, password, is_admin = false, is_active = true }) {
  try {
    // Check if user already exists
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      throw new Error('User already exists');
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `INSERT INTO \`${getTableName('users')}\` (username, password, is_admin, is_active) VALUES (@username, @password, @is_admin, @is_active)`;
    const options = {
      query,
      params: { username, password: hashedPassword, is_admin, is_active },
      location: bigqueryConfig.location
    };
    await bigquery.query(options);
    return { success: true, username };
  } catch (error) {
    console.error('Error adding user to BigQuery:', error);
    throw error;
  }
}

export async function checkUserCredentials(username, password) {
  try {
    const user = await getUserByUsername(username);
    if (!user || !user.is_active) return null;
    const match = await bcrypt.compare(password, user.password);
    if (!match) return null;
    return user;
  } catch (error) {
    console.error('Error checking user credentials:', error);
    throw error;
  }
} 

// Admin User Management
export async function getAllUsers() {
  try {
    const query = `SELECT username, is_admin, is_active FROM \`${getTableName('users')}\``;
    const options = { query, location: bigqueryConfig.location };
    const [rows] = await bigquery.query(options);
    return rows;
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
}

export async function updateUser({ username, is_admin, is_active }) {
  try {
    const query = `UPDATE \`${getTableName('users')}\` SET is_admin = @is_admin, is_active = @is_active WHERE username = @username`;
    const options = {
      query,
      params: { username, is_admin, is_active },
      location: bigqueryConfig.location
    };
    await bigquery.query(options);
    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

export async function deleteUserByUsername(username) {
  try {
    const query = `DELETE FROM \`${getTableName('users')}\` WHERE username = @username`;
    const options = {
      query,
      params: { username },
      location: bigqueryConfig.location
    };
    await bigquery.query(options);
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
} 