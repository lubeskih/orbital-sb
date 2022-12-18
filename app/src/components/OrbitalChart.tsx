// @ts-nocheck
import { Scatter } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { generateDayNightMap } from "../util";

import day from "../assets/day.png";

import { useRef, useEffect, useState } from "react";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Chart,
} from "chart.js";
import { Store } from "../store";
import React from "react";
import { BeatLoader } from "react-spinners";

const LONGITUDE_MIN = -180;
const LONGITUDE_MAX = 180;
const LONGITUDE_TICKS = 13;

const LATITUDE_MIN = -90;
const LATITUDE_MAX = 90;
const LATITUDE_TICKS = 7;

ChartJS.register(
  ChartDataLabels,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export const scales = {
  x: {
    min: LONGITUDE_MIN,
    max: LONGITUDE_MAX,
    ticks: {
      maxTicksLimit: LONGITUDE_TICKS,
      stepSize: 30,
    },
  },
  y: {
    min: LATITUDE_MIN,
    max: LATITUDE_MAX,
    ticks: {
      maxTicksLimit: LATITUDE_TICKS,
      stepSize: 30,
    },
  },
};

export const options = {
  scales: scales,
  maintainAspectRatio: false,
  responsive: true,
  bezierCurve: true,
  animations: {
    numbers: { duration: 0 },
  },
  plugins: {
    legend: {
      display: false,
    },
    datalabels: {
      formatter: function (_value: any, context: any) {
        return context.dataset.name;
      },
      color: "#000",
      backgroundColor: "rgba(255,255,255,0.5)",
      padding: 1,
      align: "bottom",
      offset: 20,
      font: {
        family: "Ubuntu Mono",
      },
    },
    tooltip: {
      callbacks: {
        label: function (context: any) {
          console.log(context);
          let timeStamp = context.raw.timeStamp;
          let label;

          if (timeStamp === undefined || timeStamp === null) {
            label = context.formattedValue;
          } else {
            label = `${context.raw.timeStamp} ${context.formattedValue}`;
          }

          return label;
        },
      },
    },
  },
  // hover: { mode: null },
  transitions: {},
  elements: {
    point: {
      radius: 10,
    },
  },
};

interface IChartProps {
  store: Store;
}

class OrbitalChart extends React.Component<IChartProps, { loaded: boolean }> {
  constructor(props: IChartProps) {
    super(props);

    this.state = {
      loaded: false,
    };
  }

  imgPlugin = {
    id: "image-plugin",
    beforeDraw: async (chart: Chart) => {
      const ctx = chart.ctx;
      const { top, left, width, height } = chart.chartArea;

      const x = left + width / 2 - height / 2;
      const y = top + height / 2 - height / 2;

      ctx.drawImage(this.props.store.image, 32, y, width, height);
    },
  };

  componentDidMount() {
    generateDayNightMap()
      .then((data) => (this.props.store.image = data))
      .then(() => this.setState({ loaded: true }));
  }

  render() {
    const { loaded } = this.state;

    if (!loaded) return <BeatLoader color="#000" />;

    return (
      <Scatter
        ref={this.props.store.chart}
        plugins={[this.imgPlugin, ChartDataLabels]}
        options={options}
        data={{ datasets: [] }}
      />
    );
  }
}

export default OrbitalChart;
