import { Bars, ChartCard, Donut } from "../components/Charts";
import { ErrorState, Loading, PageHeader } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { SERVICE_LABEL } from "../lib/format";
import { useApi } from "../lib/useApi";
import type { Summary } from "../lib/types";

export default function Analytics() {
  const { isStaff } = useAuth();
  const { data: s, error, loading, reload } = useApi<Summary>("/api/analytics/summary");
  if (loading) return <Loading />;
  if (error || !s) return <div className="card"><ErrorState message={error || "No data"} onRetry={reload} /></div>;
  return (
    <div className="animate-fade-in">
      <PageHeader title="Analytics" subtitle={isStaff ? "State-wide land governance indicators across all demo parcels and requests." : "Parcel indicators and your service request activity."} />
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Land use distribution" subtitle={`${s.total_parcels} parcels · ${s.total_area_acres} acres`}><Donut data={s.land_use_distribution} /></ChartCard>
        <ChartCard title="Parcel verification" subtitle="Cadastral record verification status"><Donut data={s.verification} /></ChartCard>
        <ChartCard title="Service requests by type" subtitle={isStaff ? "All citizen requests" : "Your requests"}>
          <Bars horizontal data={s.service_requests.map((d) => ({ ...d, name: SERVICE_LABEL[d.name] || d.name }))} />
        </ChartCard>
        <ChartCard title="Request pipeline" subtitle="Requests at each workflow stage"><Bars data={s.request_status} /></ChartCard>
        <ChartCard title="Department data coverage" subtitle="% of parcels with linked departmental records (mock)"><Bars horizontal unit="%" data={s.department_coverage} color="#16a992" /></ChartCard>
        <ChartCard title="Parcels by district"><Bars data={s.by_district} color="#345ca8" /></ChartCard>
      </div>
    </div>
  );
}
