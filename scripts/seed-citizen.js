const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function seedCitizen() {
  const email = 'citizen@shehercare.in';
  const password = 'Citizen@123';
  const fullName = 'John Citizen';

  const { data: userList } = await supabase.auth.admin.listUsers();
  const existing = userList?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

  let userId = null;
  if (existing) {
    console.log('User exists, updating password...');
    const { data: updated, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'citizen' }
    });
    if (error) console.error(error);
    userId = existing.id;
  } else {
    console.log('Creating citizen user...');
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'citizen' }
    });
    if (error) console.error(error);
    userId = data?.user?.id;
  }

  if (userId) {
    const { error: profErr } = await supabase.from('profiles').upsert({
      id: userId,
      full_name: fullName,
      role: 'citizen'
    }, { onConflict: 'id' });

    if (profErr) console.error('Profile error:', profErr);
    else console.log('Successfully created/synced citizen profile!');
  }
}

seedCitizen();
