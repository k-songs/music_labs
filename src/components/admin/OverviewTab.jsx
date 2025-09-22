import StatsCards from "./StatsCards";
import ExportControls from "./ExportControls";

export default function OverviewTab({ usersCount, sessionsStats, surveysStats, onExport }) {
  return (
    <div className="space-y-6">
      <StatsCards 
        usersCount={usersCount}
        sessionsStats={sessionsStats}
        surveysStats={surveysStats}
      />
      <ExportControls onExport={onExport} />
    </div>
  );
}
