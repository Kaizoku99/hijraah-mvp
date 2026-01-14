'use client';

import { useArtifact } from '@ai-sdk-tools/artifacts/client';
import { CRSScoreArtifact } from '@/lib/artifacts/definitions';
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface CRSData {
    totalScore: number;
    breakdown: {
        age: { score: number; details?: string };
        education: { score: number; details?: string };
        language: { firstOfficial: number; secondOfficial: number; details?: string };
        experience: { canadian: number; foreign: number; details?: string };
        transferability: number;
        additional: number;
    };
    status: string;
}

export function CRSScoreDisplay() {
    const [state] = useArtifact(CRSScoreArtifact);
    const data = state.data as CRSData | null;
    const status = state.status;

    if (!data && status !== 'streaming') return null;

    return (
        <Card className="w-full max-w-md my-4 border-primary/20">
            <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center text-lg">
                    <span>CRS Score Assessment</span>
                    {status === 'streaming' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-end">
                    <div className="text-3xl font-bold">{Math.round(data?.totalScore || 0)}</div>
                    <Badge variant={status === 'complete' ? 'default' : 'outline'}>
                        {status === 'complete' ? 'Official Estimate' : 'Calculating...'}
                    </Badge>
                </div>

                <div className="space-y-3 pt-2">
                    <ScoreRow label="Age" value={data?.breakdown?.age?.score} max={110} details={data?.breakdown?.age?.details} />
                    <ScoreRow label="Education" value={data?.breakdown?.education?.score} max={150} details={data?.breakdown?.education?.details} />
                    <ScoreRow label="Language" value={data?.breakdown?.language?.firstOfficial} max={136} details={data?.breakdown?.language?.details} />
                    <ScoreRow label="Experience" value={data?.breakdown?.experience?.foreign} max={50} details={data?.breakdown?.experience?.details} />
                </div>
            </CardContent>
        </Card>
    );
}

function ScoreRow({ label, value = 0, max, details }: { label: string; value?: number; max: number; details?: string }) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-sm">
                <span className="font-medium">{label}</span>
                <div className="flex gap-2">
                    {details && <span className="text-muted-foreground text-xs">{details}</span>}
                    <span>{value} <span className="text-muted-foreground">/ {max}</span></span>
                </div>
            </div>
            <Progress value={(value / max) * 100} className="h-2" />
        </div>
    );
}
