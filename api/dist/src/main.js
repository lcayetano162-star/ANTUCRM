"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use(require('express').json({ limit: '2mb' }));
    app.use(require('express').urlencoded({ extended: true, limit: '2mb' }));
    app.use((0, helmet_1.default)({
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
    app.enableCors({
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
    });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor());
    if (process.env.NODE_ENV !== 'production') {
        const config = new swagger_1.DocumentBuilder()
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
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api/docs', app, document);
    }
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
//# sourceMappingURL=main.js.map