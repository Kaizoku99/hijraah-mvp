'use client';

import { useArtifact } from '@ai-sdk-tools/artifacts/client';
import { ComparisonTableArtifact } from '@/lib/artifacts/definitions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Column {
    key: string;
    header: string;
}

interface ComparisonData {
    title: string;
    columns: Column[];
    rows: Record<string, string>[];
    status: string;
}

export function ComparisonTable() {
    const [state] = useArtifact(ComparisonTableArtifact);
    const data = state.data as ComparisonData | null;
    const status = state.status;

    if (!data) return null;

    return (
        <Card className="w-full my-4 overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="text-lg flex justify-between">
                    {data.title}
                    {status === 'streaming' && <Loader2 className="h-4 w-4 animate-spin" />}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {data.columns?.map((col: Column) => (
                                    <TableHead key={col.key} className="whitespace-nowrap font-bold">
                                        {col.header}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.rows?.map((row: Record<string, string>, i: number) => (
                                <TableRow key={i}>
                                    {data.columns?.map((col: Column) => (
                                        <TableCell key={`${i}-${col.key}`} className="align-top">
                                            {row[col.key] || (
                                                <span className="text-muted-foreground italic text-xs">...</span>
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
