import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appName, kafkaUrl, mailPort, mailSMtpServer } from './utils';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const port = process.env.PORT ?? 3002;

  try {
    const app = await NestFactory.create(AppModule);

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
