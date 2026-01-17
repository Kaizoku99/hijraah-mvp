
import 'dotenv/config';
import postgres from 'postgres';

async function debugFullConfig() {
    const url = process.env.DATABASE_URL;
    if (!url) return;

    console.log('--- Testing App Config ---');

    // Replicating server/db.ts logic EXACTLY
    let connectionUrl = url;
    if (!connectionUrl.includes('connect_timeout')) {
        const separator = connectionUrl.includes('?') ? '&' : '?';
        connectionUrl = `${connectionUrl}${separator}connect_timeout=30`;
    }

    console.log('Modified URL:', connectionUrl.replace(/:[^:/@]+@/, ':****@'));

    const DB_CONFIG = {
        prepare: false,
        connect_timeout: 15,
        idle_timeout: 10,
        max_lifetime: 60 * 2,
        max: 3,
        fetch_types: false,
        onnotice: () => { },
        connection: {
            application_name: 'hijraah-mvp',
        },
    };

    const sql = postgres(connectionUrl, DB_CONFIG);

    try {
        const result = await sql`SELECT version()`;
        console.log('✅ App Config Connection Successful!');
    } catch (err: any) {
        console.error('❌ App Config Failed:', err.message);
    } finally {
        await sql.end();
    }
}

debugFullConfig();
