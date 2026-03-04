import { api } from "../../api/client";

export type IncidentDto = {
  id: string;
  serviceId: string;
  title: string;
  severity: "SEV1" | "SEV2" | "SEV3" | "SEV4" | string;
  status?: string;
  createdAt?: string;
  orgId?: string;
};

export type Incident = IncidentDto;

export type CreateIncidentRequest = {
  serviceId: string;
  title: string;
  severity: "SEV1" | "SEV2" | "SEV3" | "SEV4" | string;
};

export type CreateIncidentResponse = { id: string };

const base = "/api/v1/incidents";

export function listIncidents() {
  return api.get<IncidentDto[]>(base);
}

export function getIncident(id: string) {
  return api.get<IncidentDto>(`${base}/${id}`);
}

export function createIncident(req: CreateIncidentRequest) {
  return api.post<CreateIncidentResponse>(base, req);
}

export function ackIncident(id: string) {
  return api.post<void>(`${base}/${id}/ack`, {});
}

export function resolveIncident(id: string) {
  return api.post<void>(`${base}/${id}/resolve`, {});
}

export function changeSeverity(id: string, severity: string) {
  return api.post<void>(`${base}/${id}/severity`, { severity });
}