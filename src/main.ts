import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { 
    cors: true,
    // Optimize body parser limits
    bodyParser: true,
  });
  
  // Enable compression for text-based responses only (not images)
  app.use(compression({
    threshold: 1024, // Only compress responses larger than 1KB
    level: 6, // Compression level (0-9, where 6 is a good balance)
    filter: (req, res) => {
      // Don't compress images
      if (req.url.startsWith('/uploads/')) return false;
      return compression.filter(req, res);
    },
  }));
  
  // Serve static files from uploads directory with aggressive caching for images
  // Use process.cwd() to ensure correct path in production
  const uploadsPath = join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
    maxAge: '365d', // Cache for 1 year
    immutable: true, // Tell browser files won't change
    setHeaders: (res, path) => {
      // Aggressive caching for images
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      // Enable compression hints
      res.setHeader('Vary', 'Accept-Encoding');
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
bootstrap();
