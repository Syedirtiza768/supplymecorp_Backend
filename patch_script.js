const http = require('http');
const fs = require('fs');

const logFile = 'patch_output.txt';
fs.writeFileSync(logFile, 'Starting patch...\n');

// Try with full URL as before
const data = JSON.stringify({
    imageUrl: "http://localhost:3000/uploads/flipbooks/2025-26-FW-New-Catalogue/catalog_page_001.webp"
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/flipbooks/2025-26-FW-New-Catalogue/pages/1',
    method: 'PATCH',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    fs.appendFileSync(logFile, `StatusCode: ${res.statusCode}\n`);
    let responseData = '';
    res.on('data', (d) => responseData += d);
    res.on('end', () => {
        fs.appendFileSync(logFile, `Response: ${responseData}\n`);
        process.exit(0);
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
    fs.appendFileSync(logFile, `Error: ${error.message}\n`);
    process.exit(1);
});

req.write(data);
req.end();
