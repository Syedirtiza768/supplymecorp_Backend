// Debug: Check a few sample items from each category
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Client } = require('pg');
const axios = require('axios');

async function debugCategories() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
  });

  try {
    await client.connect();
    
    // Get 3 sample items from each category
    const categories = ['Tools', 'Hardware', 'Paint'];
    
    for (const category of categories) {
      const categoryMap = {
        'Tools': '%Tools%',
        'Hardware': '%Hardware%',
        'Paint': '%Paint%',
      };
      
      const result = await client.query(`
        SELECT sku FROM orgill_products
        WHERE "category-title-description" ILIKE $1
        LIMIT 3
      `, [categoryMap[category]]);
      
      console.log(`\n📦 ${category} category samples:`);
      
      for (const row of result.rows) {
        const sku = row.sku;
        console.log(`\n  SKU: ${sku}`);
        
        try {
          const cpResponse = await axios.get(
            `${process.env.COUNTERPOINT_BASE}/${sku}`,
            {
              timeout: 3000,
              headers: {
                'APIKey': process.env.COUNTERPOINT_API_KEY,
                'Authorization': process.env.COUNTERPOINT_AUTH_BASIC,
                'Accept': 'application/json',
              }
            }
          );
          
          const item = cpResponse.data?.IM_ITEM;
          if (item) {
            console.log(`    ✓ Found in CP - IS_ECOMM_ITEM: ${item.IS_ECOMM_ITEM}`);
            console.log(`      Item: ${item.DESCR}`);
          } else {
            console.log(`    ✗ Not found in CP`);
          }
        } catch (error) {
          console.log(`    ✗ CP Error: ${error.message}`);
        }
        
        // Delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 200));
      }
    }
    
  } finally {
    await client.end();
  }
}

debugCategories();
