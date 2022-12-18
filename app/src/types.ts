export interface ActiveSatellite {
  groundTrackEnabled: boolean;
  satelliteTrackingEnabled: boolean;
  groundTrack?: { x: number; y: number }[][];
}

export interface Log {
  type: "incoming" | "info";
  msg?: string;
  data?: {
    lat: string;
    lon: string;
    spd: string;
    name: string;
  };
}
