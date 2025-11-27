import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { 
    cors: true,
    // Optimize body parser limits
    bodyParser: true,
  });
  
  // Enable compression for all responses
  app.use(compression({
    threshold: 1024, // Only compress responses larger than 1KB
    level: 6, // Compression level (0-9, where 6 is a good balance)
  }));
  
  app.setGlobalPrefix('api');
  const config = app.get(ConfigService);
  const port = parseInt(config.get<string>('PORT') || '3001', 10);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
}
bootstrap();
