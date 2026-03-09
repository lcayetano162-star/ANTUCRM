import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Límite de tamaño de body (previene ataques de payload gigante)
  app.use(require('express').json({ limit: '2mb' }));
  app.use(require('express').urlencoded({ extended: true, limit: '2mb' }));

  // Seguridad
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        frameAncestors: ["'self'"],
        baseUri: ["'self'"],
        objectSrc: ["'none'"],
        formAction: ["'self'"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    noSniff: true,
    xssFilter: true,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));
  app.use(compression());
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  });

  // Prefijo global
  app.setGlobalPrefix('api/v1');

  // Pipes de validación
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Filtros de excepciones
  app.useGlobalFilters(new HttpExceptionFilter());

  // Interceptores
  app.useGlobalInterceptors(new TransformInterceptor());

  // Documentación Swagger — solo en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('ANTU CRM API')
      .setDescription('API del sistema ANTU CRM para Canon RD')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addTag('Auth', 'Autenticación y autorización')
      .addTag('Dashboard', 'Dashboard de ventas con IA')
      .addTag('Contacts - Clientes', 'Gestión de clientes y contactos')
      .addTag('Inventory', 'Inventario inteligente con IA')
      .addTag('Health', 'Health checks y métricas')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Puerto
  const port = process.env.PORT || 3001;

  await app.listen(port);

  console.log(`
  ╔══════════════════════════════════════════════════════════╗
  ║                                                          ║
  ║   🚀 ANTU CRM API - Canon RD                             ║
  ║                                                          ║
  ╠══════════════════════════════════════════════════════════╣
  ║   📡 Server running on: http://localhost:${port}          ║
  ║   📚 Documentation:     http://localhost:${port}/api/docs ║
  ║   💓 Health Check:      http://localhost:${port}/health   ║
  ║                                                          ║
  ╚══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
