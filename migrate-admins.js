const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n');
const envMap = {};
env.forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) envMap[key.trim()] = val.join('=').replace(/^"|"$/g, '').trim();
});

const supabaseAdmin = createClient(
  envMap['NEXT_PUBLIC_SUPABASE_URL'],
  envMap['SUPABASE_SERVICE_ROLE_KEY']
);

async function checkAdmins() {
  const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    console.error(error);
    return;
  }
  
  for (const u of users.users) {
    if (u.user_metadata?.role === 'admin' || u.email === '2001mapa@gmail.com') {
      console.log(`Admin found: ${u.email} - app_metadata: ${JSON.stringify(u.app_metadata)} - user_metadata: ${JSON.stringify(u.user_metadata)}`);
      
      if (u.app_metadata?.role !== 'admin') {
        console.log(`Migrating ${u.email} to app_metadata.role = admin`);
        await supabaseAdmin.auth.admin.updateUserById(u.id, {
          app_metadata: { role: 'admin' }
        });
      }
    }
  }
}
checkAdmins();
