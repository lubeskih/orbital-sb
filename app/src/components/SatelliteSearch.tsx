// Style
import "bootstrap/dist/css/bootstrap.min.css";
import "./SatelliteSearch.css";

import { useState } from "react";
import { Store } from "../store";
import { observer } from "mobx-react-lite";
import { toJS } from "mobx";
import SatelliteSearchItem from "./SatelliteSearchItem";

interface ISatelliteSearchProps {
  store: Store;
}

const SatelliteSearch = observer((props: ISatelliteSearchProps) => {
  let all = toJS(props.store.availableSatellites);
  let [value, setValue] = useState("");

  let [alternate] = useState(true);

  const handleOnInputChange = (value: string) => {
    setValue(value);
  };

  const handleAlternate = () => {
    const color = alternate ? "#ebebeb" : "#cecece";
    alternate = !alternate;
    return color;
  };

  const items = all.filter((item) =>
    item.name.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <>
      <input
        onChange={(e) => handleOnInputChange(e.target.value)}
        className="search-listbox"
        type="text"
        id="fname"
        name="fname"
        placeholder="COSMOS 23..."
        style={{ fontFamily: "Ubuntu Mono" }}
      ></input>
      <div className="listbox">
        <>
          <small style={{ marginLeft: "6px", fontFamily: "Ubuntu Mono" }}>
            Track
          </small>
          <small
            style={{
              marginRight: "10px",
              fontFamily: "Ubuntu Mono",
              float: "right",
              textDecoration: "underline",
            }}
            title="Show/hide satellite ground track"
          >
            GT
          </small>
        </>
        <div className="elements">
          {items.map((item) => (
            <SatelliteSearchItem
              key={`${item.satnum}-${item.name}`}
              satelliteGroundTrackActive={item.isGroundTrackEnabled}
              satelliteTrackingActive={item.isActive}
              color={handleAlternate()}
              name={item.name}
              satnum={item.satnum}
              store={props.store}
            />
          ))}
        </div>
      </div>
    </>
  );
});

export default SatelliteSearch;
