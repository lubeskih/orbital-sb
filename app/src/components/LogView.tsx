// Style
import "bootstrap/dist/css/bootstrap.min.css";

import { toJS } from "mobx";
import { observer } from "mobx-react";
import { Component } from "react";
import "moment-timezone";
import { Store } from "../store";

interface ILogViewProps {
  store: Store;
}

@observer
export class LogView extends Component<ILogViewProps, {}> {
  constructor(props: ILogViewProps) {
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
        {toJS(this.props.store.log).map((log, index) => {
          if (log.type === "info") {
            return (
              <p
                key={`${log.type}-${index}-${log.msg}`}
                className="mfp-move-horizontal"
              >
                &gt; <span className="log-info">INFO</span> {log.msg}
              </p>
            );
          } else {
            return (
              <p
                className="mfp-move-horizontal"
                key={`${log.type}-${index}-${log.msg}-${log.data?.lat}-${log.data?.lon}-${log.data}`}
              >
                &gt;{" "}
                <span className="payload">
                  INC MSG <small>(redacted)</small>
                </span>
                : <span className="satnum">SAT</span> {log.data!.name}.{" "}
                <span className="latitude">LAT</span> {log.data!.lat}.{" "}
                <span className="longitude">LON</span> {log.data!.lon}.{" "}
                <span className="speed">SPD</span> {log.data!.spd} km/s{" "}
              </p>
            );
          }
        })}
      </>
    );
  }
}

export default LogView;
