import { api } from "../../api/client";

export type ServiceDto = { id: string; name: string };

export function listServices() {
  return api.get<ServiceDto[]>("/api/v1/services");
}
