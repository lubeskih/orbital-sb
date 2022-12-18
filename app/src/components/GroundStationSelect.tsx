import { SingleValue } from "react-select";
import AsyncSelect from "react-select/async";
import { Store } from "../store";

import "../Orbital.css";

interface IGroundStationSelectProps {
  store: Store;
}

function GroundStationSelect(props: IGroundStationSelectProps) {
  const promiseOptions = (inputValue: string) => {
    if (!inputValue)
      return Promise.resolve([
        {
          label: "No data. Enter a city name.",
          value: "No data. Enter a city name",
        },
      ]);

    return Promise.resolve({})
      .then(() => {
        return props.store.fetchGroundStation(inputValue);
      })
      .then((data) => {
        if (!data)
          return [
            {
              label: "No data. Enter a city name.",
              value: "No data. Enter a city name.",
            },
          ];

        return data.map((d) => ({ label: d.label, value: d.value }));
      });
  };

  const handleGroundStationChange = (
    inputValue: SingleValue<{ label: string; value: string }>
  ) => {
    if (!inputValue) return;

    let name = inputValue.label;
    let latitude = parseFloat(inputValue.value.split(";")[0]);
    let longitude = parseFloat(inputValue.value.split(";")[1]);

    props.store.updateGroundStation(name, latitude, longitude);
  };

  const customStyles = {
    control: (base: any) => ({
      ...base,
      height: 35,
      minHeight: 35,
      borderRadius: 0,
      colors: {
        primary25: "lightgray",
        primary: "#2b303b",
      },
    }),
  };

  return (
    <>
      <div className="position">
        <AsyncSelect
          styles={customStyles}
          cacheOptions
          defaultOptions
          loadOptions={promiseOptions}
          onChange={(e) => handleGroundStationChange(e)}
        />
      </div>
    </>
  );
}

export default GroundStationSelect;
