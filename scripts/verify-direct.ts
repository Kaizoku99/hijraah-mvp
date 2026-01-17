
import 'dotenv/config';
import postgres from 'postgres';

async function verifyDirect() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('DATABASE_URL is missing');
        return;
    }

    try {
        const parsed = new URL(url);
        const password = parsed.password;

        // Extract project ref from username (postgres.ref)
        const parts = parsed.username.split('.');
        let projectRef = parts.length > 1 ? parts[1] : '';

        if (!projectRef) {
            // Fallback: Check if it's already a direct URL? 
            // Direct URL host: db.ref.supabase.co
            // Pooler URL host: include 'pooler'
            if (parsed.hostname.includes('pooler')) {
                console.error('Could not extract project ref from username to construct direct URL.');
                // Try to use username as project ref if it looks like one? No, username has 'postgres.' prefix usually.
                return;
            } else {
                // Already direct or custom?
                projectRef = parsed.hostname.split('.')[0];
                // This logic is flaky but let's assume standard Supabase pooler string provided by user
            }
        }

        const directHost = `db.${projectRef}.supabase.co`;
        // Standard direct connection user is 'postgres'
        const directUrl = `postgresql://postgres:${password}@${directHost}:5432/postgres`;

        console.log(`Testing Direct Connection to: ${directHost}:5432...`);

        const sql = postgres(directUrl, {
            max: 1,
            connect_timeout: 15,
            ssl: { rejectUnauthorized: false } // Required for direct connection from some networks
        });

        try {
            const result = await sql`SELECT version()`;
            console.log('✅ Direct Connection Successful!');
            console.log('Server Version:', result[0].version);
            process.exit(0);
        } catch (err: any) {
            console.error('❌ Direct Connection Failed:', err.message);
            process.exit(1);
        } finally {
            await sql.end();
        }
    } catch (e) {
        console.error('Script Error:', e);
    }
}

verifyDirect();
