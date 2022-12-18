// Style
import "bootstrap/dist/css/bootstrap.min.css";
import "./SatelliteSearch.css";

import { useState } from "react";
import { Store } from "../store";
import { ActiveSatellite } from "../types";

interface ISatelliteSearchItemProps {
  name: string;
  satnum: string;
  satelliteTrackingActive: boolean;
  satelliteGroundTrackActive: boolean;
  color: string;
  store: Store;
}

function SatelliteSearchItem(props: ISatelliteSearchItemProps) {
  const [groundTrack, setGroundTrack] = useState(
    props.satelliteGroundTrackActive
  );

  const handleOnTrackInputChange = async (e: boolean) => {
    if (e) {
      await props.store.trackSatellite(props.satnum);
    } else {
      await props.store.untrackSatellite(props.satnum);
    }
  };

  const handleOnGroundTrackInputChange = (e: boolean) => {
    if (!props.store.activeSatellitesMap.has(props.satnum)) return false;

    const satellite = props.store.activeSatellitesMap.get(
      props.satnum
    ) as ActiveSatellite;
    satellite.groundTrackEnabled = e;

    setGroundTrack(e);

    if (e) {
      // show ground track
      props.store.showSatelliteGroundTrack(props.satnum);
    } else {
      // hide/remove ground track
      props.store.hideSatelliteGroundTrack(props.satnum);
    }
  };

  return (
    <>
      <div
        key={props.satnum}
        style={{ backgroundColor: props.color }}
        className="item"
      >
        <label className="switch">
          <input
            onChange={async (e) =>
              await handleOnTrackInputChange(e.target.checked)
            }
            type="checkbox"
            checked={props.satelliteTrackingActive}
          ></input>
          <span className="slider"></span>
        </label>{" "}
        {props.name}{" "}
        <input
          className="item-checkbox"
          onChange={(e) => handleOnGroundTrackInputChange(e.target.checked)}
          type="checkbox"
          id=""
          name=""
          value=""
          checked={groundTrack}
        ></input>
      </div>
    </>
  );
}

export default SatelliteSearchItem;
