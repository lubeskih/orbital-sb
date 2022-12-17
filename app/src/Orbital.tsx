// Style
import "bootstrap/dist/css/bootstrap.min.css";
import { toJS } from "mobx";

import { observer } from "mobx-react";
import React, { Component, useEffect, useState } from "react";

import Select from "react-select";
import Listbox from "./components/listbox";
import OrbitalChart from "./components/OrbitalChart";
import "./Orbital.css";

import banner from "./assets/banner.png";

// Store
import { Store } from "./store";
import "moment-timezone";
import moment from "moment";
const store = new Store();

interface ILogProps {
  store: Store;
}

interface IProps {
  store: Store;
}

@observer
export class LogView extends Component<IProps, {}> {
  constructor(props: IProps) {
    super(props);
  }

  render() {
    if (this.props.store.log.length === 0) {
      return (
        <>
          &gt; <span className="log-info">INFO</span> No satellite position data
          received yet. Choose satellites to track.
        </>
      );
    }

    return (
      <>
        {toJS(this.props.store.log).map((log, index) => {
          if (log.type === "info") {
            return (
              <p
                key={`${log.type}-${index}-${log.msg}`}
                className="mfp-move-horizontal"
              >
                &gt; <span className="log-info">INFO</span> {log.msg}
              </p>
            );
          } else {
            return (
              <p
                className="mfp-move-horizontal"
                key={`${log.type}-${index}-${log.msg}-${log.data?.lat}-${log.data?.lon}-${log.data}`}
              >
                &gt;{" "}
                <span className="payload">
                  INC MSG <small>(redacted)</small>
                </span>
                : <span className="satnum">SAT</span> {log.data!.name}.{" "}
                <span className="latitude">LAT</span> {log.data!.lat}.{" "}
                <span className="longitude">LON</span> {log.data!.lon}.{" "}
                <span className="speed">SPD</span> {log.data!.spd} km/s{" "}
              </p>
            );
          }
        })}
      </>
    );
  }
}

function Orbital() {
  const client = store.getClient();

  const handleOnSearchInputChange = (e: string) => {
    if (!e) return;
    store.fetchGroundStation(e);
  };

  const handleOnGroundStationChange = (groundStation?: string) => {
    if (!groundStation) return;

    store.updateGroundStation(groundStation);
  };

  const getGs = () => {
    return store.groundStations;
  };

  return (
    <div className="container">
      <div className="row">
        <div className="col-3 mt-4">
          <div className="row banner">
            <div className="col md-12 mb-3">
              <img src={banner} alt="Orbital banner"></img>
            </div>
          </div>
          <div className="row mb-3 ground_station line-on-side">
            <div className="col md-12 mb-3">
              <small className="headers">Ground Station</small>
              <div className="position">
                <Select
                  theme={(theme) => ({
                    ...theme,
                    borderRadius: 0,
                    colors: {
                      ...theme.colors,
                      primary25: "lightgray",
                      primary: "#2b303b",
                    },
                  })}
                  className="enigma-type"
                  isDisabled={false}
                  defaultValue={store.groundStations[0]}
                  options={getGs()}
                  onChange={(change) =>
                    handleOnGroundStationChange(change?.value)
                  }
                  onInputChange={(change) => handleOnSearchInputChange(change)}
                />
              </div>
            </div>
          </div>
          <div className="row satellite_listbox line-on-side">
            <div className="col md-12 mb-3">
              <small className="headers">Satellites</small>
              <div className="mt-3">
                <Listbox store={store} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-9 mt-4">
          <div className="chart">
            <OrbitalChart store={store} />
          </div>
        </div>
      </div>
      <div className="row mt-4">
        <div className="col">
          <div className="timezone">{timeZonePanel("Berlin")}</div>
        </div>
        <div className="col">
          <div className="timezone">{timeZonePanel("Moscow")}</div>
        </div>
        <div className="col">
          <div className="timezone">{timeZonePanel("Tokyo")}</div>
        </div>
        <div className="col">
          <div className="timezone">{timeZonePanel("London")}</div>
        </div>
        <div className="col">
          <div className="timezone">{timeZonePanel("Server")}</div>
        </div>
        <div className="col">
          <div className="timezone">{timeZonePanel("Local")}</div>
        </div>
      </div>
      <div className="row footer mt-3">
        <div className="col-7">
          <div className="log">
            <LogView store={store} />
          </div>
        </div>
        <div className="col">
          <div className="info">{infoPanel()}</div>
        </div>
      </div>
    </div>
  );
}

function timeZonePanel(panel: string) {
  switch (panel) {
    case "Berlin":
      return (
        <>
          <span className="timezoneCity">Berlin</span>
          <span className="timezoneTime">{Time("Berlin")}</span>
        </>
      );
    case "Moscow":
      return (
        <>
          <span className="timezoneCity">Moscow</span>
          <span className="timezoneTime">{Time("Moscow")}</span>
        </>
      );
    case "Tokyo":
      return (
        <>
          <span className="timezoneCity">Tokyo</span>
          <span className="timezoneTime">{Time("Tokyo")}</span>
        </>
      );
    case "London":
      return (
        <>
          <span className="timezoneCity">London</span>
          <span className="timezoneTime">{Time("London")}</span>
        </>
      );
    case "Server":
      return (
        <>
          <span className="timezoneCity">Server</span>
          <span className="timezoneTime">{Time("Server")}</span>
        </>
      );
    default:
      return (
        <>
          <span className="timezoneCity">Local</span>
          <span className="timezoneTime">{Time("Local")}</span>
        </>
      );
  }
}

function infoPanel() {
  return (
    <>
      Orbital. A real-time artificial satellite tracking software, written as
      part of the{" "}
      <a href="https://supabase.com/blog/launch-week-6-hackathon">
        Supabase Launch Week 6 Hackathon
      </a>
      . Orbital is using{" "}
      <a href="https://supabase.com/docs/guides/realtime">Supabase Realtime</a>{" "}
      engine to update the satellite position in real-time. For technical
      documentation regarding architecture and how it works, visit the{" "}
      <a href="https://github.com/lubeskih/orbital-sb/">docs</a>, or check the{" "}
      <a href="https://github.com/lubeskih/orbital-sb/">repository on GitHub</a>
      . Written with ❤️ by <a href="https://lh.mk">lh.mk</a>. Have fun using it
      as I had fun writing it. :-)
    </>
  );
}

function Time(key: string) {
  let tz = getTimeByKeyword(key);
  let time: string = "";

  if (tz === "UTC") {
    time = moment().utc(false).format("LTS");
  } else if (tz === "Local") {
    time = moment().local(true).format("LTS");
  } else {
    time = moment().tz(tz).format("LTS");
  }

  const [clockState, setClockState] = useState(time);

  useEffect(() => {
    // setInterval(() => {
    //   let time: string = "";
    //   if (tz === "UTC") {
    //     time = moment().utc(false).format("LTS");
    //   } else if (tz === "Local") {
    //     time = moment().local(true).format("LTS");
    //   } else {
    //     time = moment().tz(tz).format("LTS");
    //   }
    //   setClockState(time);
    // }, 1000);
  }, []);

  return <>{clockState}</>;
}

function getTimeByKeyword(key: string) {
  switch (key) {
    case "Moscow":
      return "Europe/Moscow";
    case "Berlin":
      return "Europe/Berlin";
    case "Tokyo":
      return "Asia/Tokyo";
    case "London":
      return "Europe/London";
    case "Local":
      return "Local";
    case "Server":
      return "UTC";
    default:
      return "UTC";
  }
}

export default Orbital;
