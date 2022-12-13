// Style
import "bootstrap/dist/css/bootstrap.min.css";

import * as React from "react";

import Select from "react-select";
import Listbox from "./components/listbox";
import "./Orbital.css";

// Store
import { Store } from "./store";
const store = new Store();

function Orbital() {
  const client = store.getClient();

  return (
    <div className="container">
      <div className="row">
        <div className="col-3 mt-4">
          <div className="row mb-3 line-on-side">
            <div className="col md-12 mb-3">
              <small className="info">Ground Station</small>
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
                  defaultValue={null}
                  options={store.groundStations}
                  onInputChange={(change) => console.log(change)}
                />
              </div>
            </div>
          </div>
          <div className="row mb-3 line-on-side">
            <div className="col md-12 mb-3">
              <small className="info">Satellites</small>
              <div className="mt-3">
                <Listbox store={store} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-9 mt-4">
          <div className="chart"></div>
        </div>
      </div>
      <div className="row mt-3">
        <div style={{ border: "2px solid red" }} className="col-7">
          <div className="log">{logPanel()}</div>
        </div>
        <div style={{ border: "2px solid yellow" }} className="col">
          <div className="info">{infoPanel()}</div>
        </div>
      </div>
    </div>
  );
}

function logPanel() {
  return (
    <>
      <p>
        &gt;{" "}
        <span className="payload">
          INC MSG <small>(redacted)</small>
        </span>
        : <span className="satnum">SAT</span> COSMOS 29329.{" "}
        <span className="latitude">LAT</span> 32.14323.{" "}
        <span className="longitude">LON</span> 42.13423.{" "}
        <span className="speed">SPD</span> 73.24 km/s{" "}
      </p>{" "}
      <p>
        &gt;{" "}
        <span className="payload">
          INC MSG <small>(redacted)</small>
        </span>
        : <span className="satnum">SAT</span> COSMOS 29329.{" "}
        <span className="latitude">LAT</span> 32.14323.{" "}
        <span className="longitude">LON</span> 42.13423.{" "}
        <span className="speed">SPD</span> 73.24 km/s{" "}
      </p>{" "}
      <p>
        &gt;{" "}
        <span className="payload">
          INC MSG <small>(redacted)</small>
        </span>
        : <span className="satnum">SAT</span> COSMOS 29329.{" "}
        <span className="latitude">LAT</span> 32.14323.{" "}
        <span className="longitude">LON</span> 42.13423.{" "}
        <span className="speed">SPD</span> 73.24 km/s{" "}
      </p>{" "}
      <p>
        &gt;{" "}
        <span className="payload">
          INC MSG <small>(redacted)</small>
        </span>
        : <span className="satnum">SAT</span> COSMOS 29329.{" "}
        <span className="latitude">LAT</span> 32.14323.{" "}
        <span className="longitude">LON</span> 42.13423.{" "}
        <span className="speed">SPD</span> 73.24 km/s{" "}
      </p>{" "}
      <p>
        &gt;{" "}
        <span className="payload">
          INC MSG <small>(redacted)</small>
        </span>
        : <span className="satnum">SAT</span> COSMOS 29329.{" "}
        <span className="latitude">LAT</span> 32.14323.{" "}
        <span className="longitude">LON</span> 42.13423.{" "}
        <span className="speed">SPD</span> 73.24 km/s{" "}
      </p>{" "}
      <p>
        &gt;{" "}
        <span className="payload">
          INC MSG <small>(redacted)</small>
        </span>
        : <span className="satnum">SAT</span> COSMOS 29329.{" "}
        <span className="latitude">LAT</span> 32.14323.{" "}
        <span className="longitude">LON</span> 42.13423.{" "}
        <span className="speed">SPD</span> 73.24 km/s{" "}
      </p>{" "}
      <p>
        &gt;{" "}
        <span className="payload">
          INC MSG <small>(redacted)</small>
        </span>
        : <span className="satnum">SAT</span> COSMOS 29329.{" "}
        <span className="latitude">LAT</span> 32.14323.{" "}
        <span className="longitude">LON</span> 42.13423.{" "}
        <span className="speed">SPD</span> 73.24 km/s{" "}
      </p>{" "}
      <p>
        &gt;{" "}
        <span className="payload">
          INC MSG <small>(redacted)</small>
        </span>
        : <span className="satnum">SAT</span> COSMOS 29329.{" "}
        <span className="latitude">LAT</span> 32.14323.{" "}
        <span className="longitude">LON</span> 42.13423.{" "}
        <span className="speed">SPD</span> 73.24 km/s{" "}
      </p>{" "}
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
