import { WhatsAppTester } from '@/components/admin/WhatsAppTester';

export const metadata = {
    title: 'WhatsApp Integration | Hijraah Admin',
};

export default function WhatsAppAdminPage() {
    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">WhatsApp Integration</h1>
                <p className="text-muted-foreground mt-2">
                    Manage Evolution API connection and test message delivery.
                </p>
            </div>

            <WhatsAppTester />
        </div>
    );
}
