const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const tables = await prisma.$queryRawUnsafe("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'");
    
    let schemaStr = '';
    
    for (const { table_name } of tables) {
      if (table_name === '_prisma_migrations') continue;
      
      schemaStr += `\nTABLE: ${table_name}\n`;
      
      const cols = await prisma.$queryRawUnsafe(`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${table_name}' ORDER BY column_name`);
      for (const c of cols) {
        schemaStr += `  COL: ${c.column_name} | ${c.data_type} | Null: ${c.is_nullable} | Def: ${c.column_default}\n`;
      }
      
      const constraints = await prisma.$queryRawUnsafe(`
        SELECT tc.constraint_type, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name 
        FROM information_schema.table_constraints tc 
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name 
        LEFT JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name 
        WHERE tc.table_schema = 'public' AND tc.table_name = '${table_name}'`);
        
      for (const c of constraints) {
        schemaStr += `  CONSTRAINT: ${c.constraint_type} on ${c.column_name}`;
        if (c.constraint_type === 'FOREIGN KEY') schemaStr += ` -> ${c.foreign_table_name}(${c.foreign_column_name})`;
        schemaStr += '\n';
      }
      
      const indexes = await prisma.$queryRawUnsafe(`
        SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = '${table_name}'`);
      for (const idx of indexes) {
        if (!idx.indexdef.includes('pkey')) {
           schemaStr += `  INDEX: ${idx.indexname} | ${idx.indexdef}\n`;
        }
      }
    }
    
    require('fs').writeFileSync('schema_full.txt', schemaStr);
    console.log('SUCCESS');
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
