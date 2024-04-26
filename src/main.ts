import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Prisma')
    .setDescription('The project is for hospital to do their job automatic')
    .setVersion('1.0')
    .addTag('Prisma_passport', 'prisma')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  app.use(cookieParser());
  SwaggerModule.setup('api/docs', app, document);
  await app.listen(3000, () => {
    console.log('Started');
  });
}
bootstrap();
