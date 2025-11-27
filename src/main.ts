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
  
  // Enable compression for all responses
  app.use(compression({
    threshold: 1024, // Only compress responses larger than 1KB
    level: 6, // Compression level (0-9, where 6 is a good balance)
  }));
  
  // Serve static files from uploads directory with no-cache headers
  // Use process.cwd() to ensure correct path in production
  const uploadsPath = join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
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
