
import 'dotenv/config';
import postgres from 'postgres';

async function debugConnection() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('DATABASE_URL is missing');
        return;
    }

    // Parse URL to debug parts (redacting password)
    try {
        const parsed = new URL(url);
        console.log('--- Connection Debug Info ---');
        console.log(`Protocol: ${parsed.protocol}`);
        console.log(`Hostname: ${parsed.hostname}`);
        console.log(`Port: ${parsed.port}`);
        console.log(`Pathname: ${parsed.pathname}`);
        console.log(`Username: ${parsed.username}`);
        console.log(`Password length: ${parsed.password.length}`);

        // Check for special characters in password validation
        const specialChars = /[!@#$%^&*(),.?":{}|<>]/;
        const isEncoded = /%[0-9A-F]{2}/i.test(parsed.password);
        console.log(`Password contains special chars: ${specialChars.test(parsed.password)}`);
        console.log(`Password appears URL encoded: ${isEncoded}`);

        if (parsed.password.includes('[') || parsed.password.includes(']')) {
            console.warn('WARNING: Password contains "[" or "]" characters. If these are placeholders, remove them.');
        }
    } catch (e) {
        console.error('Failed to parse URL for debugging:', e);
    }

    console.log('\n--- Attempting Connection ---');

    // Try standard connection
    const sql = postgres(url, {
        prepare: false,
        connect_timeout: 10,
        max: 1,
        onnotice: () => { },
    });

    try {
        const result = await sql`SELECT version()`;
        console.log('✅ Connection Successful!');
        console.log('Server Version:', result[0].version);
    } catch (err: any) {
        console.error('❌ Connection Failed:', err.message);
        if (err.code) console.error('Error Code:', err.code);
        if (err.name) console.error('Error Name:', err.name);

        // Check specific error types
        if (err.message.includes('SASL')) {
            console.log('\n--- Troubleshooting SASL Error ---');
            console.log('1. Double check password is correct.');
            console.log('2. If password has special characters, ensure they are URL encoded (e.g., # -> %23).');
            console.log('3. Verify you are using the correct database user (postgres vs postgres.[project-ref]).');
        }
    } finally {
        await sql.end();
    }
}

debugConnection();
