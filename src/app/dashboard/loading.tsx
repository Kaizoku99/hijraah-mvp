import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header Skeleton */}
            <header className="border-b bg-background sticky top-0 z-50">
                <div className="container flex h-16 items-center justify-between">
                    <Skeleton className="h-8 w-24" />
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </div>
            </header>

            <main className="container py-8 pb-24 md:pb-8">
                {/* Welcome Skeleton */}
                <div className="mb-6">
                    <Skeleton className="h-9 w-64 mb-2" />
                    <Skeleton className="h-5 w-48" />
                </div>

                {/* Focus Card Skeleton */}
                <Card className="mb-6">
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-4 w-full mb-4" />
                        <Skeleton className="h-10 w-32" />
                    </CardContent>
                </Card>

                {/* Stats Grid Skeleton */}
                <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardHeader className="pb-2">
                                <Skeleton className="h-4 w-20" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-16 mb-2" />
                                <Skeleton className="h-2 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Quick Actions Skeleton */}
                <div className="mb-8">
                    <Skeleton className="h-6 w-32 mb-4" />
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Card key={i}>
                                <CardContent className="p-6">
                                    <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                                    <Skeleton className="h-5 w-24 mb-2" />
                                    <Skeleton className="h-4 w-32" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}
