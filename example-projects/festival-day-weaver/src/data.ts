import festivalData from "./festival-data.json";

export type FestivalProject = {
  id: string;
  title: string;
  category: string;
  venue: string;
  address: string;
  lat: number;
  lon: number;
  link: string | null;
};

export type FestivalEvent = {
  id: string;
  project_id: string;
  start: string;
  end: string;
  arrival_minutes: number;
};

export type ServiceKind = "water" | "toilet";

export type ServicePlace = {
  id: string;
  kind: ServiceKind;
  name: string;
  detail: string;
  lat: number;
  lon: number;
};

export const projects = festivalData.projects as FestivalProject[];
export const calendarEvents = festivalData.events as FestivalEvent[];
export const festivalSnapshotDate = festivalData.generated_from;

export async function loadServices(): Promise<ServicePlace[]> {
  return festivalData.services as ServicePlace[];
}
