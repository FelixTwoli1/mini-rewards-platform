import { plainToInstance } from 'class-transformer';
import { IsString, IsNumber, IsOptional, IsEnum, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
}

export class AppConfig {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  API_GATEWAY_PORT: number = 3000;

  @IsString()
  DATABASE_URL: string = 'postgresql://rewards_user:rewards_pass@postgres:5432/rewards_db';

  @IsString()
  REDIS_URL: string = 'redis://redis:6379';

  @IsString()
  @IsOptional()
  KAFKA_BROKER: string = 'kafka:29092';

  @IsString()
  @IsOptional()
  RABBITMQ_URL: string = 'amqp://guest:guest@rabbitmq:5672';

  @IsString()
  @IsOptional()
  MESSAGING_PROVIDER: string = 'kafka';

  @IsString()
  AUTH_JWT_SECRET: string = 'your-super-secret-jwt-key-change-in-production';

  @IsNumber()
  AUTH_JWT_EXPIRATION: number = 3600;

  @IsNumber()
  POINTS_TO_MONEY_CONVERSION: number = 100;

  @IsString()
  @IsOptional()
  LOG_LEVEL: string = 'info';

  @IsString()
  @IsOptional()
  OTEL_ENABLED: string = 'true';

  @IsString()
  @IsOptional()
  OTEL_EXPORTER_OTLP_ENDPOINT: string = 'http://localhost:4317';
}

export function validateConfig(config: Record<string, unknown>): AppConfig {
  const validatedConfig = plainToInstance(AppConfig, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed: ${errors.toString()}`);
  }

  return validatedConfig;
}

export function getConfig(): AppConfig {
  return validateConfig(process.env);
}

export default getConfig();
