const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Manually parse .env.local to avoid needing dotenv dependency
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
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

// Create client using Service Role Key (bypasses RLS to allow bucket administration)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function setup() {
  console.log('Initializing Supabase Storage buckets...');
  const buckets = ['reports-evidence', 'reports-resolutions'];

  for (const bucketName of buckets) {
    console.log(`Checking/Creating bucket: "${bucketName}"...`);
    const { data: bucket, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 5242880 // 5MB limit
    });

    if (error) {
      if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
        console.log(`- Bucket "${bucketName}" already exists.`);
      } else {
        console.error(`- Error creating "${bucketName}":`, error.message);
      }
    } else {
      console.log(`- Created bucket "${bucketName}" successfully.`);
    }
  }

  console.log('\n======================================================');
  console.log('Storage buckets ensure completed.');
  console.log('IMPORTANT: Please verify that you have executed the RLS policies SQL in your Supabase SQL Editor.');
  console.log('The SQL statements can be found at the end of "schema.sql".');
  console.log('======================================================');
}

setup().catch(err => {
  console.error('Setup failed with error:', err);
  process.exit(1);
});
