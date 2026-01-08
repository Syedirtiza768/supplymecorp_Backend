import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { 
    cors: {
      origin: [
        'http://localhost:3001',
        'http://localhost:3000',
        'https://rrgeneralsupply.com',
        'https://www.rrgeneralsupply.com',
        'https://devapi.rrgeneralsupply.com'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      exposedHeaders: ['Content-Length', 'Content-Type'],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    },
    // Optimize body parser limits
    bodyParser: true,
  });

  // Add middleware to handle Private Network Access (Chrome security feature)
  app.use((req, res, next) => {
    // Set CORS headers for all requests
    const origin = req.headers.origin;
    const allowedOrigins = [
      'http://localhost:3001',
      'http://localhost:3000',
      'https://rrgeneralsupply.com',
      'https://www.rrgeneralsupply.com',
      'https://devapi.rrgeneralsupply.com'
    ];
    
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    
    // Handle Private Network Access preflight
    if (req.headers['access-control-request-private-network']) {
      res.setHeader('Access-Control-Allow-Private-Network', 'true');
    }
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    
    next();
  // Use process.cwd() to ensure correct path in production
  const uploadsPath = join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
    maxAge: '1h', // Cache for 1 hour
    immutable: false,
    setHeaders: (res, path) => {
      // 1 hour cache for all files
      res.setHeader('Cache-Control', 'public, max-age=3600');
      // Enable compression hints
      res.setHeader('Vary', 'Accept-Encoding');
      // Add CORS headers for static files
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    },
  });

  // Serve static files from public directory (for flipbook images, etc.)
  const publicPath = join(process.cwd(), 'public');
  app.useStaticAssets(publicPath, {
    maxAge: '1h', // 1 hour cache for flipbook images
    immutable: false,
    setHeaders: (res, path) => {
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
      res.setHeader('Vary', 'Accept-Encoding');
      // Add CORS headers for static files
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    },
  });
  
  app.setGlobalPrefix('api');
  const config = app.get(ConfigService);
  const port = parseInt(config.get<string>('PORT') || '3000', 10);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
  console.log(`Serving static files from: ${uploadsPath}`);
}
bootstrap().catch(err => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
