// Check category counts
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Client } = require('pg');

async function checkCounts() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
  });

  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT 
        "categoryName",
        "itemCount",
        "totalInOrgill",
        "availableInCounterpoint",
        "withValidImages",
        "updatedAt"
      FROM category_counts 
      ORDER BY "itemCount" DESC
    `);

    console.log('\n📊 Category Counts Summary\n');
    console.log('='.repeat(100));
    result.rows.forEach(row => {
      console.log(`${row.categoryName.padEnd(20)} | Count: ${String(row.itemCount).padStart(4)} | Orgill: ${String(row.totalInOrgill).padStart(4)} | CP Available: ${String(row.availableInCounterpoint).padStart(4)} | Valid Images: ${String(row.withValidImages).padStart(4)}`);
    });
    console.log('='.repeat(100));
    
    const total = result.rows.reduce((sum, row) => sum + row.itemCount, 0);
    console.log(`\n✅ Total products across all categories: ${total}`);
    console.log(`📅 Last updated: ${result.rows[0]?.updatedAt || 'N/A'}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkCounts();
