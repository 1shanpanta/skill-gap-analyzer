import { AnalysisForm } from "@/components/analysis-form";
import { RecentAnalyses } from "@/components/recent-analyses";
import { DashboardStats } from "@/components/dashboard-stats";
import { Sparkles } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <Sparkles className="h-4 w-4 text-primary opacity-60" />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Analyze how your resume stacks up against any role.
          </p>
        </div>
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
