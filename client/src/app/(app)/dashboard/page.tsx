import { AnalysisForm } from "@/components/analysis-form";
import { RecentAnalyses } from "@/components/recent-analyses";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Create a new analysis or view recent results.
        </p>
      </div>
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
