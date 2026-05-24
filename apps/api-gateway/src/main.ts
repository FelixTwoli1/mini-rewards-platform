import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { logger } from './logger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const config = app.get(ConfigService);

  // ── Security ──────────────────────────────────────────────────────────────
  app.use(helmet());
  app.enableCors({
    origin: config.getOrThrow<string>('ALLOWED_ORIGINS').split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // ── Routing ───────────────────────────────────────────────────────────────
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // ── Validation ────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Swagger ───────────────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mini Rewards Platform API')
    .setDescription(
      'Production-grade Fintech Rewards Points System.\n\n' +
      '**Author:** FelixTwoli\n\n' +
      '**Conversion rate:** 100 points = $1\n\n' +
      '**Signup bonus:** 500 points awarded on registration',
    )
    .setVersion('1.0')
    .setContact('FelixTwoli', 'https://github.com/FelixTwoli1', 'wabwirephelix135@gmail.com')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Paste your accessToken here' },
      'JWT',
    )
    .addTag('auth', 'Register, login, refresh tokens, logout')
    .addTag('users', 'User profile management')
    .addTag('rewards', 'Earn and view reward points')
    .addTag('wallet', 'Virtual wallet balance and history')
    .addTag('redemption', 'Redeem points for wallet money')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true, tagsSorter: 'alpha' },
    customSiteTitle: 'Rewards Platform API Docs',
  });

  // ── Start ─────────────────────────────────────────────────────────────────
  const port = config.getOrThrow<number>('API_GATEWAY_PORT');
  await app.listen(port);

  logger.info(`🚀 API Gateway running on http://localhost:${port}`);
  logger.info(`📖 Swagger UI:        http://localhost:${port}/api/docs`);
  logger.info(`🌍 Environment:       ${config.getOrThrow<string>('NODE_ENV')}`);
}

bootstrap().catch((err) => {
  logger.error(err, 'Failed to start API Gateway');
  process.exit(1);
});
