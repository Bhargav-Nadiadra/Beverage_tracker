import 'dotenv/config';
import { db } from '../lib/db';
import fs from 'fs';
import path from 'path';

async function main() {
    console.log('Running database setup...');

    const sqlFile = path.resolve(__dirname, 'setup-db.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    try {
        await db.query(sql);
        console.log('Database schema created successfully!');
    } catch (error) {
        console.error('Error creating database schema:', error);
        process.exit(1);
    } finally {
        // db.pool.end() if we exported pool, but db object doesn't expose it directly.
        // relying on process exit
        process.exit(0);
    }
}

main();
