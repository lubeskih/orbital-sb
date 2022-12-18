// Libraries
import { action, makeAutoObservable, observable, runInAction } from "mobx";
import { remove } from "lodash";
import * as supabase from "@supabase/supabase-js";
import React from "react";

import { ActiveSatellite, Log } from "../types";
import satone from "../assets/satone.png";
import sattwo from "../assets/sattwo.png";
import antenna from "../assets/antenna.png";
import { ANON_JWT_KEY, SUPABASE_API_URL } from "./env";
import { rgbaColors, rgbaColorsGt } from "./constants";
import { createLinearHalfHiddenFn } from "./util";
import moment from "moment";

interface IStore {
  showSatelliteGroundTrack(satnum: string): Promise<void>;
  hideSatelliteGroundTrack(satnum: string): Promise<void>;
  renderSatellitePositionOnChart(
    label: string,
    data: { x: number; y: number }[],
    satelliteName: string
  ): void;
  getAllActiveSatelliteSatnums(): {
    isActive: boolean;
    satnum: string;
    isGroundTrackEnabled: boolean;
  }[];
  subscribeToSatellite(satnum: string, satelliteName: string): Promise<void>;
  unsubscribeFromSatellite(
    satnum: string,
    satelliteName?: string
  ): Promise<void>;
  updateGroundStation(
    groundStation: string,
    latitude: number,
    longitude: number
  ): void;
  fetchGroundStation(searchString: string): Promise<
    {
      value: string;
      label: any;
    }[]
  >;
  fetchSatelliteGroundTrack(satnum: string): Promise<void>;
  fetchAvailableSatellites(): Promise<void>;
  trackSatellite(satnum: string): Promise<void>;
  untrackSatellite(satnum: string): Promise<void>;
  addToLog: (log: Log) => void;
}

/**
 * Application store
 */
export class Store implements IStore {
  rgbaColorsGt: any;
  constructor() {
    this.supabaseClient = supabase.createClient(
      SUPABASE_API_URL,
      ANON_JWT_KEY,
      {
        auth: {
          persistSession: true,
        },
      }
    );

    this.groundStationAntennaImage = new Image();
    this.groundStationAntennaImage.src = antenna;

    this.fetchAvailableSatellites();

    makeAutoObservable(this);
  }
  ///////////////
  // VARIABLES //
  ///////////////

  // supabase client
  private supabaseClient: supabase.SupabaseClient;

  // satellite related maps (chart, subscriptions ..)
  private activeSatelliteSubscribtions: Map<string, supabase.RealtimeChannel> =
    new Map();
  public activeSatellitesGroundTrackMap: Map<
    string,
    {
      lastUpdated?: number;
      data: { x: number; y: number; timeStamp: string }[][];
    }
  > = new Map();
  public satelliteChartMetadata: Map<
    string,
    {
      image: string;
      color: string;
      groundTrackColor: string;
    }
  > = new Map();

  // chart and background image
  public chart: any = React.createRef();
  public image: HTMLImageElement = new Image();
  public groundStationAntennaImage;

  // satellite icons
  public satelliteImages = [satone, sattwo];

  @observable.ref public availableSatellites: {
    name: string;
    isActive: boolean;
    isGroundTrackEnabled: boolean;
    satnum: string;
  }[] = [];

  public activeSatellitesMap: Map<string, ActiveSatellite> = new Map();
  public log: Log[] = observable.array([]);

  ///////////////
  // FUNCTIONS //
  ///////////////

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
        pointRadius: 3,
        pointHoverRadius: 8,
        fill: false,
        borderColor: color,
      };
    });

    const f = this.chart.current.data.datasets.find(
      (set: any) => set.label === label
    );
    if (f) {
      remove(this.chart.current.data.datasets, (set: any) => {
        return set.label === label;
      });
    }

    gtSets.forEach((dataset) => {
      this.chart.current.data.datasets.push(dataset);
    });

    this.chart.current.update();

    return;
  }

  public async hideSatelliteGroundTrack(satnum: string) {
    if (!this.activeSatellitesGroundTrackMap.has(satnum)) return;

    const label = `${satnum}-ground-track`;

    const f = this.chart.current.data.datasets.find(
      (set: any) => set.label === label
    );
    if (f) {
      remove(this.chart.current.data.datasets, (set: any) => {
        return set.label === label;
      });
    }

    this.chart.current.update();
  }

  public renderSatellitePositionOnChart(
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
      color = rgbaColors[Math.floor(Math.random() * rgbaColors.length)];
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

    const f = this.chart.current.data.datasets.find(
      (set: any) => set.label === label
    );
    if (f) {
      remove(this.chart.current.data.datasets, (set: any) => {
        return set.label === label;
      });
    }

    datasets.forEach((dataset: any) => {
      this.chart.current.data.datasets.push(dataset);
    });

    this.chart.current.update();
    return;
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
      return;
    }

    await this.fetchSatelliteGroundTrack(satnum);

    this.addToLog({
      type: "info",
      timeStamp: moment().format("h:mm:ss A"),
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

          this.addToLog({
            type: "incoming",
            msg: `Incoming payload from ${name}`,
            timeStamp: moment().format("h:mm:ss A"),
            data: {
              lat: latitude,
              lon: longitude,
              spd: speed,
              name: name,
            },
          });

          this.renderSatellitePositionOnChart(
            `${satnum}`,
            [{ x: longitude, y: latitude }],
            satelliteName
          );
        }
      )
      .subscribe();

    this.activeSatelliteSubscribtions.set(satnum, subscription);
    this.addToLog({
      type: "info",
      timeStamp: moment().format("h:mm:ss A"),
      msg: `Connected. Now tracking ${satelliteName} (${satnum}). Satellite will appear on the map as soon as Orbital receives it's position.`,
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

      const f = this.chart.current.data.datasets.find(
        (set: any) => set.label === satnum
      );
      if (f) {
        remove(this.chart.current.data.datasets, (set: any) => {
          return set.label === satnum;
        });
      }

      this.addToLog({
        type: "info",
        timeStamp: moment().format("h:mm:ss A"),
        msg: `Disconnected. Connection to ${satelliteName} (${satnum}) closed.`,
      });

      this.chart.current.update();
    }

    if (this.satelliteChartMetadata.has(satnum)) {
      this.satelliteChartMetadata.delete(satnum);
    }

    return;
  }

  public updateGroundStation(
    groundStation: string,
    latitude: number,
    longitude: number
  ) {
    // check if exists, if so, delete first
    // datasets.find()
    const f = this.chart.current.data.datasets.find(
      (set: any) => set.label === "gs"
    );
    if (f) {
      remove(this.chart.current.data.datasets, (set: any) => {
        return set.label === "gs";
      });
    }

    let datasets = [
      {
        name: `${groundStation}`,
        label: `gs`,
        datalabels: {
          display: true,
        },
        pointStyle: this.groundStationAntennaImage,
        data: [
          {
            x: longitude,
            y: latitude,
          },
        ],
        radius: 1,
        borderWidth: 0,
        pointColor: "transparent",
        pointBorderColor: rgbaColorsGt[0],
        backgroundColor: rgbaColorsGt[0],
        fill: true,
      },
    ];

    datasets.forEach((dataset) => {
      this.chart.current.data.datasets.push(dataset);
    });

    this.chart.current.update();
    return;
  }

  public async fetchGroundStation(searchString: string) {
    const { data, error } = await this.supabaseClient
      .from("ground_station")
      .select("name,latitude,longitude,elevation")
      .ilike("name", `%${searchString}%`)
      .limit(5);

    if (error) {
      console.error(
        `Error while fetching ground stations. Error ${error.message}`
      );
      return [
        { value: "No ground station data.", label: "No ground station data." },
      ];
    }
    if (data === null)
      return [
        { value: "No ground station data.", label: "No ground station data." },
      ];
    else {
      return data.map((gs) => ({
        value: `${gs.latitude};${gs.longitude}`,
        label: gs.name,
      }));
    }
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
    const parsed = JSON.parse(ground_track) as {
      x: number;
      y: number;
      timeStamp: string;
    }[][];

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
}
