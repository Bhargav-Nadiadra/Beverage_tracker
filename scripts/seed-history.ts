import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function seedHistory() {
    console.log('Seeding historical data...');
    
    // Get users and orgs
    const usersRes = await pool.query('SELECT id, email FROM users');
    const orgsRes = await pool.query('SELECT id FROM organizations');
    
    if (usersRes.rows.length === 0 || orgsRes.rows.length === 0) {
        console.error('No users or organizations found. Please register first.');
        process.exit(1);
    }
    
    const userIds = usersRes.rows.map(u => u.id);
    const orgId = orgsRes.rows[0].id;
    
    const today = new Date();
    const batchSize = 100;
    let logs = [];
    
    for (let i = 0; i < 90; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        // Random number of logs for this day
        const dailyLogsCount = Math.floor(Math.random() * 8) + 2;
        
        for (let j = 0; j < dailyLogsCount; j++) {
            const userId = userIds[Math.floor(Math.random() * userIds.length)];
            const type = Math.random() > 0.4 ? 'COFFEE' : 'TEA';
            const logDate = new Date(date);
            // Random hour between 7 AM and 8 PM
            logDate.setHours(7 + Math.floor(Math.random() * 13), Math.floor(Math.random() * 60));
            
            logs.push({ userId, orgId, type, logDate });
        }
    }
    
    console.log(`Inserting ${logs.length} historical logs...`);
    
    for (let i = 0; i < logs.length; i += batchSize) {
        const batch = logs.slice(i, i + batchSize);
        const queries = batch.map(log => 
            pool.query(
                'INSERT INTO beverage_logs (user_id, organization_id, beverage_type, logged_at, created_at) VALUES ($1, $2, $3, $4, NOW())',
                [log.userId, log.orgId, log.type, log.logDate]
            )
        );
        await Promise.all(queries);
    }
    
    console.log('Successfully seeded historical data!');
    await pool.end();
}

seedHistory().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
