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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const ADMIN_ACCOUNTS = [
  {
    departmentId: 'pwd',
    departmentName: 'Public Works / Engineering',
    email: 'admin.pwd@shehercare.in',
    password: 'Sheher@PWD26',
    fullName: 'Public Works / Engineering Admin'
  },
  {
    departmentId: 'electrical',
    departmentName: 'Electrical Department',
    email: 'admin.electrical@shehercare.in',
    password: 'Sheher@ELEC26',
    fullName: 'Electrical Department Admin'
  },
  {
    departmentId: 'health',
    departmentName: 'Public Health Department',
    email: 'admin.health@shehercare.in',
    password: 'Sheher@HEALTH26',
    fullName: 'Public Health Department Admin'
  },
  {
    departmentId: 'water',
    departmentName: 'Water Supply Department',
    email: 'admin.water@shehercare.in',
    password: 'Sheher@WATER26',
    fullName: 'Water Supply Department Admin'
  },
  {
    departmentId: 'sewerage',
    departmentName: 'Sewerage & Drainage Department',
    email: 'admin.sewerage@shehercare.in',
    password: 'Sheher@SEWER26',
    fullName: 'Sewerage & Drainage Department Admin'
  },
  {
    departmentId: 'solidwaste',
    departmentName: 'Solid Waste Management Department',
    email: 'admin.solidwaste@shehercare.in',
    password: 'Sheher@WASTE26',
    fullName: 'Solid Waste Management Department Admin'
  },
  {
    departmentId: 'gardens',
    departmentName: 'Garden & Parks Department',
    email: 'admin.gardens@shehercare.in',
    password: 'Sheher@GARDEN26',
    fullName: 'Garden & Parks Department Admin'
  },
  {
    departmentId: 'townplanning',
    departmentName: 'Town Planning / Encroachment',
    email: 'admin.townplanning@shehercare.in',
    password: 'Sheher@PLAN26',
    fullName: 'Town Planning / Encroachment Admin'
  },
  {
    departmentId: 'traffic',
    departmentName: 'Traffic Department',
    email: 'admin.traffic@shehercare.in',
    password: 'Sheher@TRAFFIC26',
    fullName: 'Traffic Department Admin'
  },
  {
    departmentId: 'grievance',
    departmentName: 'General Administration / Grievance Cell',
    email: 'admin.grievance@shehercare.in',
    password: 'Sheher@ADMIN26',
    fullName: 'General Administration / Grievance Cell Admin'
  }
];

async function seedAdmins() {
  console.log('--- Starting Department Admin Seeding in Supabase ---');
  
  // 1. Fetch existing users
  const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Failed to list auth users:', listError);
    process.exit(1);
  }

  const existingMap = new Map();
  userList.users.forEach(u => {
    if (u.email) existingMap.set(u.email.toLowerCase(), u);
  });

  for (const admin of ADMIN_ACCOUNTS) {
    const emailKey = admin.email.toLowerCase();
    let userId = null;

    if (existingMap.has(emailKey)) {
      const existingUser = existingMap.get(emailKey);
      userId = existingUser.id;
      console.log(`[Update] User already exists for ${admin.email} (id: ${userId}), updating password & metadata...`);
      
      const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
        password: admin.password,
        email_confirm: true,
        user_metadata: {
          full_name: admin.fullName,
          department: admin.departmentId,
          department_name: admin.departmentName,
          role: 'admin'
        }
      });
      if (updateErr) console.error(`  Error updating auth user ${admin.email}:`, updateErr.message);
    } else {
      console.log(`[Create] Creating auth user ${admin.email}...`);
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: admin.email,
        password: admin.password,
        email_confirm: true,
        user_metadata: {
          full_name: admin.fullName,
          department: admin.departmentId,
          department_name: admin.departmentName,
          role: 'admin'
        }
      });

      if (createErr) {
        console.error(`  Error creating user ${admin.email}:`, createErr.message);
        continue;
      }
      userId = newUser.user.id;
    }

    // Upsert into profiles table
    if (userId) {
      const profileData = {
        id: userId,
        full_name: admin.fullName,
        role: 'admin'
      };

      const { error: profErr } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (profErr) {
        console.error(`  Error updating profile for ${admin.email}:`, profErr.message);
      } else {
        console.log(`  ✓ Successfully synced profile for ${admin.fullName} (${admin.email})`);
      }
    }
  }

  console.log('--- Finished Department Admin Seeding successfully! ---');
}

seedAdmins().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
