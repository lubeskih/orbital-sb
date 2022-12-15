// Style
import "bootstrap/dist/css/bootstrap.min.css";
import "./listbox.css";

import React, { useState } from "react";
import { Store } from "../store";
import { observer } from "mobx-react-lite";
import { toJS } from "mobx";
import { ActiveSatellite } from "../types";

interface IListboxProps {
  store: Store;
}

const ListBox = observer((props: IListboxProps) => {
  let all = toJS(props.store.availableSatellites);
  let [value, setValue] = useState("");

  let [alternate, setAlternate] = useState(true);

  const handleOnInputChange = (value: string) => {
    setValue(value);
  };

  const handleAlternate = () => {
    const color = alternate ? "#ebebeb" : "#cecece";
    alternate = !alternate;
    return color;
  };

  const items = all.filter((item) => item.name.includes(value));

  return (
    <>
      <input
        onChange={(e) => handleOnInputChange(e.target.value)}
        className="search-listbox"
        type="text"
        id="fname"
        name="fname"
        placeholder="Filter ..."
      ></input>
      <div className="listbox">
        <div className="elements">
          {items.map((item) => (
            <>
              {/* <p>{item.isActive ? "true" : "false"}</p> */}
              <Item
                satelliteGroundTrackActive={item.isGroundTrackEnabled}
                satelliteTrackingActive={item.isActive}
                color={handleAlternate()}
                name={item.name}
                satnum={item.satnum}
                store={props.store}
              />
            </>
          ))}
        </div>
      </div>
    </>
  );
});

interface IItemProps {
  name: string;
  satnum: string;
  satelliteTrackingActive: boolean;
  satelliteGroundTrackActive: boolean;
  color: string;
  store: Store;
}

function Item(props: IItemProps) {
  const [track, setTrack] = useState(props.satelliteTrackingActive);
  const [groundTrack, setGroundTrack] = useState(
    props.satelliteGroundTrackActive
  );

  const handleOnTrackInputChange = async (e: boolean) => {
    setTrack(e);

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
          checked={props.satelliteGroundTrackActive}
        ></input>
      </div>
    </>
  );
}

export default ListBox;
