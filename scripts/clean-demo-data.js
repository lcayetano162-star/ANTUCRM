#!/usr/bin/env node
/**
 * Script de limpieza de datos de demo
 * Elimina todos los datos de prueba del sistema
 */

const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function cleanDemoData() {
  console.log('🧹 Iniciando limpieza de datos de demo...\n');
  
  try {
    await pool.query('BEGIN');
    
    // Eliminar en orden correcto (respetando FKs)
    const deletions = [
      // Actividades primero
      { table: 'activities', where: "description LIKE '%Demo%' OR description LIKE '%demo%'" },
      { table: 'activities', where: "EXISTS (SELECT 1 FROM users u WHERE u.id = activities.user_id AND u.email LIKE '%@demo.com')" },
      
      // Oportunidades
      { table: 'opportunities', where: "name LIKE '%Demo%' OR name LIKE '%Test%'" },
      
      // Contactos
      { table: 'contacts', where: "email LIKE '%@demo.com' OR email LIKE '%@test.com'" },
      
      // Clientes
      { table: 'clients', where: "name LIKE '%Demo%' OR name LIKE '%Test%' OR email LIKE '%@demo.com'" },
      
      // Usuarios (no admins)
      { table: 'users', where: "email LIKE '%@demo.com' AND role != 'super_admin'" },
      { table: 'users', where: "email IN ('vendedor@antucrm.com', 'admin@antucrm.com')" },
      
      // Tenant demo
      { table: 'tenants', where: "slug = 'antucrm-principal'" },
      { table: 'tenants', where: "name LIKE '%Demo%'" }
    ];
    
    let totalDeleted = 0;
    
    for (const { table, where } of deletions) {
      try {
        const result = await pool.query(`DELETE FROM ${table} WHERE ${where} RETURNING id`);
        if (result.rowCount > 0) {
          console.log(`  ✓ ${table}: ${result.rowCount} registros eliminados`);
          totalDeleted += result.rowCount;
        }
      } catch (e) {
        console.log(`  ⚠ ${table}: ${e.message}`);
      }
    }
    
    await pool.query('COMMIT');
    
    console.log(`\n✅ Limpieza completada: ${totalDeleted} registros eliminados`);
    
    // Mostrar estadísticas
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM tenants) as tenants,
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM clients) as clients,
        (SELECT COUNT(*) FROM opportunities) as opportunities
    `);
    
    console.log('\n📊 Estadísticas actuales:');
    console.log(`  Tenants: ${stats.rows[0].tenants}`);
    console.log(`  Usuarios: ${stats.rows[0].users}`);
    console.log(`  Clientes: ${stats.rows[0].clients}`);
    console.log(`  Oportunidades: ${stats.rows[0].opportunities}`);
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('\n❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

cleanDemoData();
