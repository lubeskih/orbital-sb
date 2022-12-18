// Style
import "bootstrap/dist/css/bootstrap.min.css";

import { useEffect, useState } from "react";
import "moment-timezone";
import moment from "moment";

import "../Orbital.css";

export function TimezonePanel() {
  return (
    <>
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
    </>
  );
}

export function timeZonePanel(panel: string) {
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
    // TODO: messes up the chart for some reason
    setInterval(() => {
      let time: string = "";
      if (tz === "UTC") {
        time = moment().utc(false).format("LTS");
      } else if (tz === "Local") {
        time = moment().local(true).format("LTS");
      } else {
        time = moment().tz(tz).format("LTS");
      }
      setClockState(time);
    }, 5000);
  }, [tz]);

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
