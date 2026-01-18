// Test Counterpoint API connection
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const axios = require('axios');

async function testCounterpoint() {
  const base = process.env.COUNTERPOINT_BASE || 'https://utility.rrgeneralsupply.com/Item';
  const apiKey = process.env.COUNTERPOINT_API_KEY || '';
  const authBasic = process.env.COUNTERPOINT_AUTH_BASIC || '';
  
  console.log('🔍 Testing Counterpoint API');
  console.log('Base URL:', base);
  console.log('API Key:', apiKey ? '✓ Set' : '✗ Not set');
  console.log('Auth Basic:', authBasic ? '✓ Set' : '✗ Not set');
  console.log('');
  
  // Test with a sample SKU
  const testSku = '9971821'; // From your example
  
  try {
    console.log(`📡 Fetching item: ${testSku}`);
    const response = await axios.get(`${base}/${testSku}`, {
      timeout: 6000,
      headers: {
        'APIKey': apiKey,
        'Authorization': authBasic,
        'Accept': 'application/json',
      }
    });
    
    console.log('✅ Response received!');
    console.log('Status:', response.status);
    console.log('');
    
    const data = response.data;
    console.log('Response data:');
    console.log('  ErrorCode:', data.ErrorCode);
    console.log('  IM_ITEM exists:', !!data.IM_ITEM);
    
    if (data.IM_ITEM) {
      console.log('  ITEM_NO:', data.IM_ITEM.ITEM_NO);
      console.log('  IS_ECOMM_ITEM:', data.IM_ITEM.IS_ECOMM_ITEM);
      console.log('  DESCR:', data.IM_ITEM.DESCR);
      console.log('  PRC_1:', data.IM_ITEM.PRC_1);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testCounterpoint();
