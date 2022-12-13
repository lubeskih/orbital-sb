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
        <div className="col-9 mt-4">col-4col-8</div>
      </div>
      <div className="row mt-3">
        <div className="col-3">col-4</div>
        <div className="col">col-8</div>
        <div className="col">col-8</div>
      </div>
    </div>
  );
}

export default Orbital;
