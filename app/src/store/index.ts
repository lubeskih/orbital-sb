// Libraries
import { action, makeAutoObservable, observable, runInAction } from "mobx";

import * as supabase from "@supabase/supabase-js";
import { ActiveSatellite } from "../types";

/**
 * Application store
 */
export class Store {
  private supabaseClient: supabase.SupabaseClient;
  private activeSatelliteSubscribtions: Map<string, supabase.RealtimeChannel> =
    new Map();

  constructor() {
    this.supabaseClient = supabase.createClient(
      "https://ztrblgtcslxbqawnthvg.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0cmJsZ3Rjc2x4YnFhd250aHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzA2MTY2NDEsImV4cCI6MTk4NjE5MjY0MX0.wKrIum0Fqruru1pFB3rdKJAPj4YecZ_D6hCtmlOWvcA",
      {
        auth: {
          persistSession: true,
        },
      }
    );

    this.fetchAvailableSatellites();
    this.fetchGroundStation("A");

    makeAutoObservable(this);
  }

  public async subscribeToSatellite(satnum: string) {
    if (this.activeSatelliteSubscribtions.has(satnum)) {
      console.info("Aready subscribed to ", satnum);
      return;
    }

    const subscription = this.supabaseClient
      .channel(`public:satellite:satnum=eq.${satnum}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "satellite",
          filter: `satnum=eq.${satnum}`,
        },
        (payload) => {
          if (payload.errors) {
            console.error(
              `Error while getting payload for satellite: ${satnum}. Error: ${payload.errors}`
            );
            return;
          }

          const { name, latitude, longitude, speed } = payload.new;

          console.log(
            `${name}: (${latitude}, ${longitude}) with ${speed} km/s`
          );
          this.addToLog({
            lat: latitude,
            lon: longitude,
            spd: speed,
            name: name,
          });
        }
      )
      .subscribe();

    this.activeSatelliteSubscribtions.set(satnum, subscription);
    console.info("Subscribed to satellite ", satnum);

    return;
  }

  public async unsubscribeFromSatellite(satnum: string) {
    if (this.activeSatelliteSubscribtions.has(satnum)) {
      await this.activeSatelliteSubscribtions.get(satnum)?.unsubscribe();
      this.activeSatelliteSubscribtions.delete(satnum);

      console.info("Unsubscribed from satellite ", satnum);
      return;
    }
  }

  public getClient = () => {
    return this.supabaseClient;
  };

  public async fetchGroundStation(searchString: string) {
    console.log("Received search string ", searchString);
    this.groundStations = [];

    const { data, error } = await this.supabaseClient
      .from("ground_station")
      .select("name,latitude,longitude,elevation")
      .ilike("name", `%${searchString}%`)
      .limit(5);

    if (error) {
      console.error(
        `Error while fetching ground stations. Error ${error.message}`
      );
      return;
    }

    console.log("Received data ", data);

    runInAction(() =>
      data.forEach((gs) =>
        this.groundStations.push({ value: gs.name, label: gs.name })
      )
    );
  }

  public async fetchAvailableSatellites() {
    const { data, error } = await this.supabaseClient
      .from("satellite")
      .select("name,satnum")
      .limit(100);

    if (error) {
      console.error(
        `Error while fetching available satellites. Error ${error.message}`
      );
      return;
    }

    let satellites = data.map((item) => ({
      ...item,
      isActive: false,
      isGroundTrackEnabled: false,
    }));

    runInAction(() => (this.availableSatellites = satellites));
    runInAction(() => {
      this.availableSatellites.forEach((sat) =>
        this.activeSatellitesMap.set(sat.satnum, {
          groundTrackEnabled: false,
          satelliteTrackingEnabled: false,
        })
      );
    });

    console.log(this.availableSatellites);
    console.log(this.activeSatellitesMap);
  }

  public async trackSatellite(satnum: string) {
    // update activeSatellites Map
    if (!this.activeSatellitesMap.has(satnum)) return;

    this.activeSatellitesMap.get(satnum)!.satelliteTrackingEnabled = true;

    // update list
    let s = this.availableSatellites.findIndex(
      (satellite) => satellite.satnum === satnum
    );

    if (s !== -1) {
      this.availableSatellites[s].isActive = true;
      this.subscribeToSatellite(satnum);
    }
  }

  public async untrackSatellite(satnum: string) {
    if (!this.activeSatellitesMap.has(satnum)) return;

    this.activeSatellitesMap.get(satnum)!.satelliteTrackingEnabled = false;

    let s = this.availableSatellites.findIndex(
      (satellite) => satellite.satnum === satnum
    );

    if (s !== -1) {
      this.availableSatellites[s].isActive = false;
      await this.unsubscribeFromSatellite(satnum);
    }
  }

  @observable.ref public availableSatellites: {
    name: string;
    isActive: boolean;
    isGroundTrackEnabled: boolean;
    satnum: string;
  }[] = [];
  public activeSatellitesMap: Map<string, ActiveSatellite> = new Map();

  @observable public activeSatellites: { name: string; satnum: string }[] = [];
  @observable.ref public groundStations: { value: string; label: string }[] =
    [];

  @observable public currentGroundStations = [];
  @observable public selectedSatellite = null;

  private supabaseUrl = process.env.SUPABASE_URL || "";
  private supabaseApiKey = process.env.SUPABASE_API_KEY || "";

  // array or map od item => flag
  // metod shto selektira flag

  // dodava vo array
  // array se koristi vo listbox da se izrenderirash checked / uncheck
  // vo isto vreme se koristi vo mapata da znaeme dal se render ili ne

  public log: {
    lat: string;
    lon: string;
    spd: string;
    name: string;
  }[] = observable.array([]);

  addToLog = action(
    (data: { lat: string; lon: string; spd: string; name: string }) => {
      if (this.log.length > 9) {
        // TODO: first log on top instead
        this.log.pop();
      }

      // redact
      data.lat = parseFloat(data.lat).toPrecision(5).toString();
      data.lon = parseFloat(data.lon).toPrecision(5).toString();
      data.spd = parseFloat(data.spd).toPrecision(5).toString();

      this.log.unshift(data);
    }
  );
}
