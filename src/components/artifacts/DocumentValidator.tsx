'use client';

import { useArtifact } from '@ai-sdk-tools/artifacts/client';
import { ValidationArtifact } from '@/lib/artifacts/definitions';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Loader2, XCircle, AlertTriangle } from "lucide-react";

interface Check {
    id: string;
    label: string;
    status: 'pending' | 'checking' | 'pass' | 'fail' | 'warning';
    message?: string;
}

interface ValidationData {
    fileName: string;
    checks: Check[];
    overallStatus: string;
}

export function DocumentValidator() {
    const [state] = useArtifact(ValidationArtifact);
    const data = state.data as ValidationData | null;

    if (!data) return null;

    return (
        <Card className="w-full my-4">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                    Validating: {data.fileName}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {data.checks?.map((check: Check) => (
                        <div key={check.id} className="flex items-start gap-3 text-sm">
                            <StatusIcon status={check.status} />
                            <div className="flex-1">
                                <div className="font-medium text-foreground">{check.label}</div>
                                {check.message && (
                                    <div className="text-muted-foreground text-xs mt-0.5">{check.message}</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                {data.overallStatus === 'approved' && (
                    <div className="mt-4 p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded text-center text-sm font-medium">
                        Document Verified Successfully
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function StatusIcon({ status }: { status: string }) {
    switch (status) {
        case 'checking':
            return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
        case 'pass':
            return <CheckCircle2 className="h-5 w-5 text-green-500" />;
        case 'fail':
            return <XCircle className="h-5 w-5 text-red-500" />;
        case 'warning':
            return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
        default:
            return <Circle className="h-5 w-5 text-muted-foreground opacity-30" />;
    }
}
