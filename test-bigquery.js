import { 
  testBigQueryConnection, 
  checkAllTableSchemas,
  getPlayerStats,
  getGoldPrices,
  getScrollPrices,
  getPlayers,
  getXpValues,
  getMobValues
} from './bigquery-service.js';

async function testBigQuery() {
  console.log('🧪 Testing BigQuery connection and data access...\n');
  
  try {
    // Test connection
    console.log('1. Testing connection...');
    const connectionOk = await testBigQueryConnection();
    if (!connectionOk) {
      console.error('❌ Connection failed');
      return;
    }
    console.log('✅ Connection successful\n');
    
    // Check schemas
    console.log('2. Checking table schemas...');
    await checkAllTableSchemas();
    console.log('');
    
    // Test data access
    console.log('3. Testing data access...');
    
    console.log('   Testing playerStats...');
    try {
      const playerStats = await getPlayerStats();
      console.log(`   ✅ Found ${playerStats.length} player stats`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('   Testing goldPrices...');
    try {
      const goldPrices = await getGoldPrices();
      console.log(`   ✅ Found ${goldPrices.length} gold prices`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('   Testing scrollPrices...');
    try {
      const scrollPrices = await getScrollPrices();
      const totalScrollPrices = Object.keys(scrollPrices).reduce((sum, key) => 
        sum + scrollPrices[key].gold.length + scrollPrices[key].diamond.length, 0);
      console.log(`   ✅ Found ${totalScrollPrices} scroll prices`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('   Testing players...');
    try {
      const players = await getPlayers();
      console.log(`   ✅ Found ${players.length} players`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('   Testing xpValues...');
    try {
      const xpValues = await getXpValues();
      console.log(`   ✅ Found ${xpValues.length} XP values`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('   Testing mobValues...');
    try {
      const mobValues = await getMobValues();
      console.log(`   ✅ Found ${mobValues.length} mob values`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('\n🎉 BigQuery test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testBigQuery(); 