
import { ActivityFeed } from "@/components/app/home/ActivityFeed";
import { CampaignProgress } from "@/components/app/home/CampaignProgress";
import { MetricsChart } from "@/components/app/home/MetricsChart";
import { QuickActions } from "@/components/app/home/QuickActions";
import { StatsRow } from "@/components/app/home/StatsRow";
import { UploadWizard } from "@/components/app/home/UploadWizard";

export default function DashboardHomePage() {
  return (
    <div className="mx-auto max-w-[1680px]">
      <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[1fr_minmax(280px,360px)] xl:items-start xl:gap-8">
        <div className="flex min-w-0 flex-col gap-6">
          <UploadWizard />
          <MetricsChart />
          <div className="overflow-x-auto pb-1 md:overflow-visible">
            <div className="min-w-[min(100%,640px)]">
              <StatsRow />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <QuickActions />
            <CampaignProgress />
          </div>
        </div>
        <aside className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-[4.5rem] xl:self-start">
          <ActivityFeed />
        </aside>
      </div>
    </div>
  );
}
