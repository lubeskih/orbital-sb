// Libraries
import { observable } from "mobx";

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

    this.availableSatellites = data;

    console.log(this.availableSatellites);
  }

  @observable public activeSatellites: { name: string; satnum: string }[] = [];
  @observable public availableSatellites: { name: string; satnum: string }[] =
    [];
  @observable public groundStations: { value: string; label: string }[] = [];

  @observable public currentGroundStations = [];
  @observable public selectedSatellite = null;

  private supabaseUrl = process.env.SUPABASE_URL || "";
  private supabaseApiKey = process.env.SUPABASE_API_KEY || "";
}
