const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function main() {
  const prisma = new PrismaClient();
  try {
    const columns = await prisma.$queryRawUnsafe("SELECT table_name, column_name, data_type, column_default, is_nullable FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, column_name;");
    
    let prodSchema = '';
    for (const col of columns) {
      if (col.table_name === '_prisma_migrations') continue;
      prodSchema += col.table_name + ' | ' + col.column_name + ' | ' + col.data_type + ' | ' + col.is_nullable + ' | ' + col.column_default + '\n';
    }
    
    fs.writeFileSync('prod_schema.txt', prodSchema);
    console.log('SUCCESS');
  } catch(e) {
    console.error('Error consultando BD:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
