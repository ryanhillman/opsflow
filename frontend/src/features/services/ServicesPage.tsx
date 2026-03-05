import { useEffect, useState } from "react";
import { listServices } from "./api";
import type { ServiceDto } from "./api";
import { useToast } from "../../app/providers/ToastProvider";

function ServiceRowSkeleton() {
  return (
    <div className="card" style={{ boxShadow: "none", padding: "12px 14px" }}>
      <div className="skeleton" style={{ height: 15, width: "38%", borderRadius: 4 }} />
      <div className="skeleton" style={{ height: 12, width: "22%", borderRadius: 4, marginTop: 8 }} />
    </div>
  );
}

export function ServicesPage() {
  const toast = useToast();
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listServices()
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch((e: any) => {
        if (e?.status !== 401) toast.error(e?.message ?? "Failed to load services");
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="container" style={{ display: "grid", gap: 18 }}>
      <div>
        <h1 className="h1">Services</h1>
        <div className="subtle">All services in your organization.</div>
      </div>

      <section className="card">
        <div className="cardHeader">
          <div style={{ fontWeight: 750 }}>Service catalog</div>
        </div>
        <div className="cardBody">
          {isLoading ? (
            <div style={{ display: "grid", gap: 10 }}>
              {Array.from({ length: 3 }).map((_, i) => <ServiceRowSkeleton key={i} />)}
            </div>
          ) : services.length === 0 ? (
            <div className="emptyState">
              <div className="emptyIcon">📦</div>
              <div className="emptyTitle">No services yet</div>
              <div className="emptySubtitle">Services will appear here once added to your organization.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {services.map((s) => (
                <div
                  key={s.id}
                  className="card"
                  style={{ boxShadow: "none", padding: "12px 14px" }}
                >
                  <div style={{ fontWeight: 650 }}>{s.name}</div>
                  <div className="subtle" style={{ marginTop: 4, fontSize: 12 }}>{s.id}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
