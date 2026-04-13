const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:FSiuLT1IbINE3sdH@db.mazfhswbnskghpgsssqb.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to DB');
    
    const migrationPath1 = path.join(__dirname, '../../supabase/migrations/20260210000000_update_projects_m2m.sql');
    const sql1 = fs.readFileSync(migrationPath1, 'utf8');
    await client.query(sql1);
    console.log('Migration 1 executed successfully');

    const migrationPath2 = path.join(__dirname, '../../supabase/migrations/20260210000001_project_images_bucket.sql');
    const sql2 = fs.readFileSync(migrationPath2, 'utf8');
    await client.query(sql2);
    console.log('Migration 2 executed successfully');

  } catch (err) {
    console.error('Error executing migration', err);
    
    // Try pooler if first fails
    try {
        console.log('Trying pooler...');
        const poolerClient = new Client({
            connectionString: 'postgresql://postgres.mazfhswbnskghpgsssqb:FSiuLT1IbINE3sdH@aws-0-ap-south-1.pooler.supabase.com:6543/postgres',
            ssl: { rejectUnauthorized: false }
        });
        await poolerClient.connect();
        
        const migrationPath1 = path.join(__dirname, '../../supabase/migrations/20260210000000_update_projects_m2m.sql');
        const sql1 = fs.readFileSync(migrationPath1, 'utf8');
        await poolerClient.query(sql1);
        console.log('Migration 1 executed successfully via pooler');

        const migrationPath2 = path.join(__dirname, '../../supabase/migrations/20260210000001_project_images_bucket.sql');
        const sql2 = fs.readFileSync(migrationPath2, 'utf8');
        await poolerClient.query(sql2);
        console.log('Migration 2 executed successfully via pooler');

        await poolerClient.end();
    } catch (err2) {
        console.error('Error with pooler', err2);
    }
  } finally {
    await client.end();
  }
}

run();
