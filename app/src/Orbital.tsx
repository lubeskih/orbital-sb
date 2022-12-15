// Style
import "bootstrap/dist/css/bootstrap.min.css";
import { toJS } from "mobx";

import { observer } from "mobx-react";
import React, { Component } from "react";

import Select from "react-select";
import Listbox from "./components/listbox";
import OrbitalChart from "./components/OrbitalChart";
import "./Orbital.css";

import banner from "./assets/banner.png";

// Store
import { Store } from "./store";
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
        {toJS(this.props.store.log).map((log, index) => (
          <p
            className="mfp-move-horizontal"
            key={`${log.lat}-${log.lon}-${log.name}-${log.spd}`}
          >
            &gt;{" "}
            <span className="payload">
              INC MSG <small>(redacted)</small>
            </span>
            : <span className="satnum">SAT</span> {log.name}.{" "}
            <span className="latitude">LAT</span> {log.lat}.{" "}
            <span className="longitude">LON</span> {log.lon}.{" "}
            <span className="speed">SPD</span> {log.spd} km/s{" "}
          </p>
        ))}
      </>
    );
  }
}

function Orbital() {
  const client = store.getClient();

  const handleOnSearchInputChange = (e: string) => {
    if (!e) return;
    // console.log("TUKA", e);
    store.fetchGroundStation(e);
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
            <OrbitalChart />
          </div>
        </div>
      </div>
      {/* <div className="row mt-3">
        <div className="col">
          <div className="timezone">{timeZonePanel()}</div>
        </div>
        <div className="col">
          <div className="timezone">{timeZonePanel()}</div>
        </div>
        <div className="col">
          <div className="timezone">{timeZonePanel()}</div>
        </div>
      </div> */}
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

function timeZonePanel() {
  return (
    <>
      <p>local: August 6, Monday, 10:23:12 AM, 2022</p>
    </>
  );
}

function infoPanel() {
  return (
    <>
      Orbital. A real-time artificial satellite tracking software, written as
      part of the Supabase Launch Week 6 Hackathon. Orbital is using Supabase
      Realtime engine to update the satellite position and ground track in
      real-time. For technical documentation regarding architecture and how it
      works, check the docs. Repository. Written with ❤️ by{" "}
      <a href="https://lh.mk">lh.mk</a>. Have fun using it as I had fun writing
      it. :-)
    </>
  );
}

export default Orbital;
