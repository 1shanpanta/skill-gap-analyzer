import { AnalysisForm } from "@/components/analysis-form";
import { RecentAnalyses } from "@/components/recent-analyses";
import { DashboardStats } from "@/components/dashboard-stats";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Run a new analysis or pick up where you left off.
        </p>
      </div>
      <DashboardStats />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AnalysisForm />
        </div>
        <div>
          <RecentAnalyses />
        </div>
      </div>
    </div>
  );
}
