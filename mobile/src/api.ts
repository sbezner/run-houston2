import { API_BASE } from "./config";
import { Race } from "./types";

export async function fetchRaces(): Promise<Race[]> {
  const res = await fetch(`${API_BASE}/races`);
  if (!res.ok) throw new Error(`Failed to fetch races: ${res.status}`);
  const data = (await res.json()) as Race[];
  
   

  const withCoords = data.filter(
    r => typeof r.latitude === "number" && typeof r.longitude === "number"
  );
  console.log("---")
  console.log("Races with coords (api.ts):", withCoords.length);


  // Only keep races that have coordinates
  return data.filter(
    r => typeof r.latitude === "number" && typeof r.longitude === "number"
  );
}
