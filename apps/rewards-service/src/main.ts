import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { logger } from '@rewards/logger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.use(helmet());
  app.enableCors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*', credentials: true });
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  const config = new DocumentBuilder()
    .setTitle('Rewards Service API')
    .setDescription('Reward points management for Rewards Platform')
    .setVersion('1.0')
    .setContact('FelixTwoli', '', 'wabwirephelix135@gmail.com')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .addTag('rewards', 'Reward points operations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.REWARDS_SERVICE_PORT || 3002;
  await app.listen(port);
  logger.info(`Rewards Service running on port ${port}`);
}

bootstrap().catch((err) => {
  logger.error(err, 'Failed to start Rewards Service');
  process.exit(1);
});
