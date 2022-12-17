// Libraries
import { action, makeAutoObservable, observable, runInAction } from "mobx";
import { remove } from "lodash";

import * as supabase from "@supabase/supabase-js";
import { ActiveSatellite } from "../types";
import { ChartJSOrUndefined } from "react-chartjs-2/dist/types";

import satone from "../assets/satone.png";
import sattwo from "../assets/sattwo.png";
import antenna from "../assets/antenna.png";

function createLinearHalfHiddenFn() {
  let dir = true;
  return (from: number, to: number, fraction: number) => {
    if (fraction > 0.99 && dir) {
      dir = false;
    }
    if (fraction < 0.01 && !dir) {
      dir = true;
    }
    return dir ? fraction * to : 0;
  };
}

/**
 * Application store
 */
export class Store {
  private supabaseClient: supabase.SupabaseClient;
  private activeSatelliteSubscribtions: Map<string, supabase.RealtimeChannel> =
    new Map();
  public activeSatellitesGroundTrackMap: Map<
    string,
    { lastUpdated?: number; data: { x: number; y: number }[][] }
  > = new Map();
  public satelliteChartMetadata: Map<
    string,
    {
      image: string;
      color: string;
      groundTrackColor: string;
    }
  > = new Map();
  public chart: ChartJSOrUndefined;
  public rgbaColors = [
    "rgba(37, 150, 190,1)",
    "rgba(50, 125, 168,1)",
    "rgba(50, 168, 133,1)",
    "rgba(119, 50, 168,1)",
    "rgba(168, 50, 60,1)",
  ];

  public rgbaColorsGt = [
    "rgba(37, 150, 190,0.5)",
    "rgba(50, 125, 168,0.5)",
    "rgba(50, 168, 133,0.5)",
    "rgba(119, 50, 168,0.5)",
    "rgba(168, 50, 60,0.5)",
  ];

  public satelliteImages = [satone, sattwo];

  public currentGroundStation: {
    name: string;
    latitude: number;
    longitude: number;
    color: string;
    image: string;
  } = {
    name: "",
    latitude: 0,
    longitude: 0,
    color: "",
    image: "",
  };

  public async showSatelliteGroundTrack(satnum: string) {
    if (!this.activeSatellitesGroundTrackMap.has(satnum)) return;

    const label = `${satnum}-ground-track`;

    const gt = this.activeSatellitesGroundTrackMap.get(satnum);

    let color: string;

    if (this.satelliteChartMetadata.has(satnum)) {
      const metadata = this.satelliteChartMetadata.get(satnum);
      color = metadata!.color;
    } else {
      return;
    }

    let gtSets = gt!.data.map((data) => {
      return {
        satnum: label,
        label: label,
        data: data,
        order: 1,
        datalabels: {
          display: false,
        },
        showLine: true,
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        borderColor: color,
      };
    });

    const f = this.chart?.data.datasets.find((set) => set.label === label);
    if (f) {
      remove(this.chart!.data.datasets, (set) => {
        return set.label === label;
      });
    }

    gtSets.forEach((dataset) => {
      this.chart?.data.datasets.push(dataset);
    });

    this.chart?.update();

    return;
  }

  public async hideSatelliteGroundTrack(satnum: string) {
    if (!this.activeSatellitesGroundTrackMap.has(satnum)) return;

    const label = `${satnum}-ground-track`;

    const f = this.chart?.data.datasets.find((set) => set.label === label);
    if (f) {
      remove(this.chart!.data.datasets, (set) => {
        return set.label === label;
      });
    }

    this.chart?.update();
  }

  public addDataSet(
    label: string,
    data: { x: number; y: number }[],
    satelliteName: string
  ) {
    let satImage = new Image();
    let color: string;

    if (this.satelliteChartMetadata.has(label)) {
      const metadata = this.satelliteChartMetadata.get(label);
      satImage.src = metadata!.image;
      color = metadata!.color;
    } else {
      // register
      color =
        this.rgbaColors[Math.floor(Math.random() * this.rgbaColors.length)];
      let image =
        this.satelliteImages[
          Math.floor(Math.random() * this.satelliteImages.length)
        ];
      satImage.src = image;
      this.satelliteChartMetadata.set(label, {
        color: color,
        groundTrackColor: color,
        image: image,
      });
    }

    let datasets = [
      {
        name: `${satelliteName}`,
        label: `${label}`,
        data: data,
        radius: 0,
        borderWidth: 2,
        pointColor: "transparent",
        pointBorderColor: color,
        backgroundColor: color,
        fill: true,
        datalabels: {
          display: false,
        },
        order: 2,
        animations: {
          radius: {
            duration: 3000,
            loop: false,
            delay: 1000,
            to: 50,
            fn: createLinearHalfHiddenFn(),
          },
          numbers: { duration: 0 },
          colors: {
            type: "color",
            duration: 3000,
            delay: 1000,
            to: "transparent",
            loop: false,
          },
        },
      },
      {
        name: `${satelliteName}`,
        label: `${label}`,
        datalabels: {
          display: true,
        },
        pointStyle: satImage,
        data: data,
        radius: 1,
        borderWidth: 0,
        pointColor: "transparent",
        pointBorderColor: color,
        backgroundColor: color,
        fill: true,
      },
    ];

    // check if exists, if so, delete first
    // datasets.find()

    const f = this.chart?.data.datasets.find((set) => set.label === label);
    if (f) {
      remove(this.chart!.data.datasets, (set) => {
        return set.label === label;
      });
    }

    datasets.forEach((dataset) => {
      this.chart?.data.datasets.push(dataset);
    });

    this.chart?.update();
    return;
  }

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

  public getAllActiveSatelliteSatnums() {
    return this.availableSatellites
      .filter((satellite) => satellite.isActive)
      .map((satellite) => ({
        isActive: satellite.isActive,
        satnum: satellite.satnum,
        isGroundTrackEnabled: satellite.isGroundTrackEnabled,
      }));
  }

  public async subscribeToSatellite(satnum: string, satelliteName: string) {
    if (this.activeSatelliteSubscribtions.has(satnum)) {
      console.info("Aready subscribed to ", satnum);
      return;
    }

    await this.fetchSatelliteGroundTrack(satnum);

    this.addToLog({
      type: "info",
      msg: `Establishing connection to ${satelliteName} (${satnum}) ...`,
    });

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

          console.log(payload);

          this.addToLog({
            type: "incoming",
            msg: `Incoming payload from ${name}`,
            data: {
              lat: latitude,
              lon: longitude,
              spd: speed,
              name: name,
            },
          });

          this.addDataSet(
            `${satnum}`,
            [{ x: longitude, y: latitude }],
            satelliteName
          );
        }
      )
      .subscribe();

    this.activeSatelliteSubscribtions.set(satnum, subscription);
    console.info("Subscribed to satellite ", satnum);
    this.addToLog({
      type: "info",
      msg: `Connected. Now tracking ${satelliteName} (${satnum})`,
    });

    return;
  }

  public async unsubscribeFromSatellite(
    satnum: string,
    satelliteName?: string
  ) {
    if (this.activeSatelliteSubscribtions.has(satnum)) {
      await this.activeSatelliteSubscribtions.get(satnum)?.unsubscribe();
      this.activeSatelliteSubscribtions.delete(satnum);

      const f = this.chart?.data.datasets.find((set) => set.label === satnum);
      if (f) {
        console.log("exists, removing");
        remove(this.chart!.data.datasets, (set) => {
          return set.label === satnum;
        });
      }

      this.addToLog({
        type: "info",
        msg: `Disconnected. Connection to ${satelliteName} (${satnum}) closed.`,
      });

      this.chart!.update();
    }

    if (this.satelliteChartMetadata.has(satnum)) {
      this.satelliteChartMetadata.delete(satnum);
    }

    return;
  }

  public getClient = () => {
    return this.supabaseClient;
  };

  public updateGroundStation(groundStation: string) {
    let gs = this.groundStations.find(
      (station) => station.label === groundStation
    );

    console.log("GS", gs);
    console.log(this.groundStations);
    if (!gs) {
      console.log("NO");
      return;
    }

    this.currentGroundStation.latitude = gs.latitude;
    this.currentGroundStation.longitude = gs.longitude;
    this.currentGroundStation.color = this.rgbaColors[0];

    console.log("CURRENT:", this.currentGroundStation);

    let satImage = new Image();
    satImage.src = antenna;
    this.currentGroundStation.image = satImage.src;

    console.log(this.currentGroundStation.longitude);
    console.log(this.currentGroundStation.latitude);
    let datasets = [
      {
        name: `${groundStation}`,
        label: `gs`,
        data: [
          {
            x: this.currentGroundStation.longitude,
            y: this.currentGroundStation.latitude,
          },
        ],
        radius: 0,
        borderWidth: 2,
        pointColor: "transparent",
        pointBorderColor: this.currentGroundStation.color,
        backgroundColor: this.currentGroundStation.color,
        fill: true,
        datalabels: {
          display: false,
        },
        order: 2,
        animations: {
          radius: {
            duration: 3000,
            loop: false,
            delay: 1000,
            to: 50,
            fn: createLinearHalfHiddenFn(),
          },
          numbers: { duration: 0 },
          colors: {
            type: "color",
            duration: 3000,
            delay: 1000,
            to: "transparent",
            loop: false,
          },
        },
      },
      {
        name: `${groundStation}`,
        label: `gs`,
        datalabels: {
          display: true,
        },
        pointStyle: satImage,
        data: [
          {
            x: this.currentGroundStation.longitude,
            y: this.currentGroundStation.latitude,
          },
        ],
        radius: 1,
        borderWidth: 0,
        pointColor: "transparent",
        pointBorderColor: this.currentGroundStation.color,
        backgroundColor: this.currentGroundStation.color,
        fill: true,
      },
    ];

    // check if exists, if so, delete first
    // datasets.find()

    const f = this.chart?.data.datasets.find((set) => set.label === "gs");
    if (f) {
      remove(this.chart!.data.datasets, (set) => {
        return set.label === "gs";
      });
    }

    datasets.forEach((dataset) => {
      this.chart?.data.datasets.push(dataset);
    });

    this.chart?.update();
    return;
  }

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
    if (!data) return;

    runInAction(() =>
      data.forEach((gs) =>
        this.groundStations.push({
          value: gs.name,
          label: gs.name,
          latitude: parseFloat(gs.latitude),
          longitude: parseFloat(gs.longitude),
        })
      )
    );
  }

  public async fetchSatelliteGroundTrack(satnum: string) {
    const { data, error } = await this.supabaseClient
      .from("satellite")
      .select("ground_track")
      .eq("satnum", `${satnum}`)
      .limit(1);

    if (error) {
      console.error(
        `Error while fetching ground track for satellite ${satnum}. Error ${error.message}`
      );
      return;
    }

    const { ground_track } = data[0];
    const parsed = JSON.parse(ground_track) as { x: number; y: number }[][];

    if (this.activeSatellitesGroundTrackMap.has(satnum)) {
      this.activeSatellitesGroundTrackMap.set(satnum, {
        ...this.activeSatellitesGroundTrackMap.get(satnum),
        data: parsed,
      });
    } else {
      this.activeSatellitesGroundTrackMap.set(satnum, {
        lastUpdated: Date.now(),
        data: parsed,
      });
    }
  }

  public async fetchAvailableSatellites() {
    const { data, error } = await this.supabaseClient
      .from("satellite")
      .select("name,satnum")
      .limit(100)
      .order("name", { ascending: true });

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
      this.subscribeToSatellite(satnum, this.availableSatellites[s].name);
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
      await this.unsubscribeFromSatellite(
        satnum,
        this.availableSatellites[s].name
      );
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
  @observable.ref public groundStations: {
    value: string;
    label: string;
    latitude: number;
    longitude: number;
  }[] = [];

  @observable public currentGroundStations = [];
  @observable public selectedSatellite = null;

  private supabaseUrl = process.env.SUPABASE_URL || "";
  private supabaseApiKey = process.env.SUPABASE_API_KEY || "";

  // array or map od item => flag
  // metod shto selektira flag

  // dodava vo array
  // array se koristi vo listbox da se izrenderirash checked / uncheck
  // vo isto vreme se koristi vo mapata da znaeme dal se render ili ne

  public log: Log[] = observable.array([]);

  addToLog = action((log: Log) => {
    if (this.log.length > 9) {
      this.log.pop();
    }

    // redact

    if (log.data && log.type === "incoming") {
      log.data.lat = parseFloat(log.data.lat).toPrecision(5).toString();
      log.data.lon = parseFloat(log.data.lon).toPrecision(5).toString();
      log.data.spd = parseFloat(log.data.spd).toPrecision(5).toString();
    }

    this.log.unshift(log);
  });

  // ChartJS
}

interface Log {
  type: "incoming" | "info";
  msg?: string;
  data?: {
    lat: string;
    lon: string;
    spd: string;
    name: string;
  };
}
