import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import { Express } from 'express';

let cachedApp: Express;

async function bootstrap(): Promise<Express> {
  if (!cachedApp) {
    const expressApp = express();
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
      {
        logger: ['error', 'warn', 'log'],
      },
    );

    // Enable validation globally
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    // Enable CORS - Allow all requests from anywhere
    app.enableCors({
      origin: '*', // Allow all origins
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: '*', // Allow all headers
      credentials: false, // Set to false when origin is '*'
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });

    await app.init();
    cachedApp = expressApp;
  }

  return cachedApp;
}

export default async (req, res) => {
  const app = await bootstrap();
  return app(req, res);
};

