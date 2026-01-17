
import 'dotenv/config';
import { getDb } from '../server/db';

async function verify() {
    console.log('Starting database connection verification...');
    try {
        // getDb() internally runs 'SELECT 1' to ensure connection is valid
        const db = await getDb();

        if (db) {
            console.log('✅ SUCCESS: Database connection established and verified.');
            process.exit(0);
        } else {
            console.error('❌ FAILURE: Could not establish database connection (db is null).');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ ERROR: Exception during connection verification:', error);
        process.exit(1);
    }
}

verify();
