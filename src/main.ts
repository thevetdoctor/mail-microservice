import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  appName,
  cacheTtl,
  kafkaUrl,
  mailPort,
  mailSMtpServer,
  port,
  redisHost,
  redisPassword,
  redisPort,
} from './utils';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import { CustomHttpExceptionFilter } from './filters/exceptionFilter';
dotenv.config();

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    app.useGlobalFilters(new CustomHttpExceptionFilter());
    app.enableCors();
    const config = new DocumentBuilder()
      .setTitle(appName)
      .setDescription(`API Docs for ${appName}`)
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header',
        },
        'JWT',
      )
      .build();
    const document: OpenAPIObject = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);

    await app.listen(port);
    const app_url = await app.getUrl();

    console.log('REDIS_HOST:', process.env.REDIS_HOST, redisHost);
    console.log('REDIS_PORT:', process.env.REDIS_PORT, redisPort);
    console.log('REDIS_PASSWORD:', process.env.REDIS_PASSWORD, redisPassword);
    console.log('CACHE_TTL:', process.env.CACHE_TTL, cacheTtl);
    console.log('KAFKA_URL:', kafkaUrl ? kafkaUrl : 'Not Supplied');
    console.log(
      'MAIL_SMTP_SERVER:',
      mailSMtpServer ? mailSMtpServer : 'Not Supplied',
    );
    console.log('MAIL_PORT:', mailPort ? mailPort : 'Not Supplied');

    console.log(`Application is running on: ${app_url}`);
    console.log(`Swagger Docs path for ${appName}: ${app_url}/api-docs`);
  } catch (err) {
    console.error('Error starting the application:', err);
  }
}
bootstrap();
