import { AppHeader } from "@/components/AppHeader"
import { DrawIntelligence } from "@/components/draws/DrawIntelligence"
import { getLatestDrawsAction } from "@/actions/applications"
import { getLatestCrs } from "@/actions/crs"

export default async function DrawsPage() {
    const draws = await getLatestDrawsAction(50)
    const latestCrs = await getLatestCrs()

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <AppHeader />
            <main className="container py-8 pb-24 md:pb-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">Express Entry Intelligence</h1>
                    <p className="text-muted-foreground">
                        Real-time analysis, predictions, and trend monitoring for Canada's Express Entry draws.
                    </p>
                </div>

                <DrawIntelligence
                    draws={draws}
                    userCrsScore={latestCrs?.totalScore}
                />
            </main>
        </div>
    )
}
