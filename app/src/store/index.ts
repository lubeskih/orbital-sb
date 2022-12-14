// Libraries
import { action, makeAutoObservable, observable, runInAction } from "mobx";

import * as supabase from "@supabase/supabase-js";

/**
 * Application store
 */
export class Store {
  private supabaseClient: supabase.SupabaseClient;
  private satellitePositionChannel: supabase.RealtimeChannel;
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

    this.satellitePositionChannel =
      this.supabaseClient.channel("satellite_position");

    this.subscribeToSatellite("32052");

    this.fetchAvailableSatellites();

    makeAutoObservable(this);
  }

  public async subscribeToSatellite(satnum: string) {
    if (this.activeSatelliteSubscribtions.has(satnum)) {
      console.info("Aready subscribed to ", satnum);
      return;
    }

    const subscription = this.satellitePositionChannel
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
      this.activeSatelliteSubscribtions.get(satnum)?.unsubscribe();
      this.activeSatelliteSubscribtions.delete(satnum);

      console.info("Unsubscribed from satellite ", satnum);
      return;
    }
  }

  public getClient = () => {
    return this.supabaseClient;
  };

  public async fetchGroundStation(searchString: string) {
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

    data.forEach((gs) => {
      console.log(gs);

      this.groundStations.push({ value: gs.name, label: gs.name });
    });
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

    runInAction(() => (this.availableSatellites = data));

    console.log(this.availableSatellites);
  }

  @observable.ref public availableSatellites: {
    name: string;
    satnum: string;
  }[] = [];
  @observable public activeSatellites: { name: string; satnum: string }[] = [];
  @observable public groundStations: { value: string; label: string }[] = [];

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
