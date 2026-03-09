const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function RunHealthCheck() {
    console.log('--- ANTU CRM SYSTEM HEALTH CHECK ---');
    let errors = 0;

    // 1. Check Env Vars
    console.log('\n[1] Checking Environment Variables...');
    const criticalVars = ['DATABASE_URL', 'JWT_SECRET', 'ENCRYPTION_KEY'];
    criticalVars.forEach(v => {
        if (!process.env[v]) {
            console.error(`❌ Missing ${v}`);
            errors++;
        } else {
            console.log(`✅ ${v} is set`);
        }
    });

    if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length !== 64) {
        console.error('❌ ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
        errors++;
    }

    // 2. Check Database
    console.log('\n[2] Checking Database Connection...');
    const prisma = new PrismaClient();
    try {
        await prisma.$queryRaw`SELECT 1`;
        console.log('✅ Database connection successful');

        const tableCount = await prisma.$queryRaw`SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'`;
        console.log(`📊 Total tables in public schema: ${tableCount[0].count}`);
    } catch (e) {
        console.error('❌ Database connection failed:', e.message);
        errors++;
    }

    // 3. Check Critical Files
    console.log('\n[3] Checking Critical Files...');
    const files = [
        'docker-compose.yml',
        'Dockerfile',
        'prisma/schema.prisma'
    ];
    files.forEach(f => {
        if (fs.existsSync(path.join(process.cwd(), f))) {
            console.log(`✅ ${f} exists`);
        } else {
            console.error(`❌ ${f} missing!`);
            errors++;
        }
    });

    console.log('\n--- HEALTH CHECK SUMMARY ---');
    if (errors === 0) {
        console.log('🚀 SYSTEM READY FOR PRODUCTION!');
    } else {
        console.error(`🛑 Found ${errors} issues. Please fix them before deploying.`);
    }

    await prisma.$disconnect();
}

RunHealthCheck();
