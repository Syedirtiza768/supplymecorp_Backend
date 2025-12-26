/**
 * Update Hotspot URLs Script
 * Updates all flipbook hotspot URLs from localhost to production domain
 * Run with: node update-hotspot-urls.js
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'global321',
  database: 'orgill',
});

async function updateHotspotUrls() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking current hotspot URLs...\n');
    
    // Check current state
    const checkQuery = `
      SELECT 
        COUNT(*) as total_hotspots, 
        COUNT(CASE WHEN "linkUrl" LIKE '%localhost%' THEN 1 END) as localhost_count,
        COUNT(CASE WHEN "linkUrl" LIKE '/shop/%' THEN 1 END) as relative_path_count
      FROM flipbook_hotspots
    `;
    
    const checkResult = await client.query(checkQuery);
    console.log('Current state:');
    console.log(`  Total hotspots: ${checkResult.rows[0].total_hotspots}`);
    console.log(`  With localhost: ${checkResult.rows[0].localhost_count}`);
    console.log(`  With relative paths: ${checkResult.rows[0].relative_path_count}`);
    console.log('');
    
    // Update localhost URLs to production domain
    console.log('🔄 Updating localhost URLs to production domain...');
    const updateLocalhostQuery = `
      UPDATE flipbook_hotspots 
      SET "linkUrl" = REPLACE("linkUrl", 'http://localhost:3001', 'https://dev.rrgeneralsupply.com')
      WHERE "linkUrl" LIKE '%localhost:3001%'
      RETURNING id, "linkUrl"
    `;
    
    const localhostResult = await client.query(updateLocalhostQuery);
    console.log(`✅ Updated ${localhostResult.rowCount} localhost URLs\n`);
    
    // Update relative URLs to absolute URLs
    console.log('🔄 Converting relative URLs to absolute URLs...');
    const updateRelativeQuery = `
      UPDATE flipbook_hotspots 
      SET "linkUrl" = 'https://dev.rrgeneralsupply.com' || "linkUrl"
      WHERE "linkUrl" LIKE '/shop/%' 
        AND "linkUrl" NOT LIKE 'http%'
      RETURNING id, "linkUrl"
    `;
    
    const relativeResult = await client.query(updateRelativeQuery);
    console.log(`✅ Updated ${relativeResult.rowCount} relative URLs\n`);
    
    // Show sample of updated URLs
    console.log('📋 Sample of updated URLs:');
    const sampleQuery = `
      SELECT "linkUrl", COUNT(*) as count
      FROM flipbook_hotspots
      GROUP BY "linkUrl"
      ORDER BY count DESC
      LIMIT 10
    `;
    
    const sampleResult = await client.query(sampleQuery);
    sampleResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.linkUrl} (${row.count} hotspots)`);
    });
    
    console.log('\n✨ All hotspot URLs updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating hotspot URLs:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the update
updateHotspotUrls()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
