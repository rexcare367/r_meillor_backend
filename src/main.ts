import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    '/billing/stripe/webhook',
    bodyParser.raw({ type: 'application/json' }),
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

  await app.listen(3005);
  console.log(`Application is running on: http://localhost:3005`);
}
bootstrap();
