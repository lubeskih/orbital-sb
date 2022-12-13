// Style
import "bootstrap/dist/css/bootstrap.min.css";
import "./listbox.css";

import React, { useState } from "react";
import { Store } from "../store";

interface IListboxProps {
  store: Store;
}

function Listbox(props: IListboxProps) {
  let all = props.store.availableSatellites;
  let [items, setItems] = useState(all);
  let [alternate, setAlternate] = useState(true);

  console.log("EMPTY", all);

  // let items = ["andrej", "tino", "stefan", "andrej", "tino", "stefan"];

  const handleOnInputChange = (value: string) => {
    setItems(all.filter((item) => item.name.includes(value)));
  };

  const handleAlternate = () => {
    const color = alternate ? "#ebebeb" : "#cecece";
    alternate = !alternate;
    return color;
  };

  return (
    <>
      <div className="listbox">
        <div className="elements">
          <input
            onChange={(e) => handleOnInputChange(e.target.value)}
            className="search-listbox"
            type="text"
            id="fname"
            name="fname"
          ></input>
          {items.map((item) => (
            <>
              <Item color={handleAlternate()} name={item.name} />
            </>
          ))}
        </div>
      </div>
    </>
  );
}

interface IItemProps {
  name: string;
  color: string;
}

function Item(props: IItemProps) {
  return (
    <>
      <div style={{ backgroundColor: props.color }} className="item">
        <label className="switch">
          <input type="checkbox"></input>
          <span className="slider"></span>
        </label>{" "}
        {props.name}{" "}
        <input
          className="item-checkbox"
          type="checkbox"
          id="vehicle1"
          name="vehicle1"
          value="Bike"
        ></input>
      </div>
    </>
  );
}

export default Listbox;
