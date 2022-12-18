// Style
import "bootstrap/dist/css/bootstrap.min.css";

import "moment-timezone";

import SatelliteSearch from "./components/SatelliteSearch";
import OrbitalChart from "./components/OrbitalChart";
import "./Orbital.css";
import banner from "./assets/banner.png";

import LogView from "./components/LogView";
import GroundStationSelect from "./components/GroundStationSelect";
import { infoPanel } from "./components/InfoPanel";
import { TimezonePanel } from "./components/TimezonePanel";

// Store
import { Store } from "./store";
const store = new Store();

function Orbital() {
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
              <GroundStationSelect store={store} />
            </div>
          </div>
          <div className="row satellite_listbox line-on-side">
            <div className="col md-12 mb-3">
              <small className="headers">Satellites</small>
              <div className="mt-3">
                <SatelliteSearch store={store} />
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
        <TimezonePanel />
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

export default Orbital;
