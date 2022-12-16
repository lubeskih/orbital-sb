export interface ActiveSatellite {
  groundTrackEnabled: boolean;
  satelliteTrackingEnabled: boolean;
  groundTrack?: { x: number; y: number }[][];
}
