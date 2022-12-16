// @ts-nocheck
// import { observer } from "mobx-react-lite";
import { Scatter } from "react-chartjs-2";
// Assuming logo.png is in the same folder as JS file
import day from "../assets/day.png";

import React from "react";
import { useRef, useEffect } from "react";
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

const LONGITUDE_MIN = -180;
const LONGITUDE_MAX = 180;
const LONGITUDE_TICKS = 13;

const LATITUDE_MIN = -90;
const LATITUDE_MAX = 90;
const LATITUDE_TICKS = 7;

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

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
  },
  transitions: {},
  elements: {
    point: {
      radius: 10,
    },
  },
};

const image = new Image();
image.src = day;
const imgPlugin = {
  id: "custom_canvas_background_image",
  beforeDraw: (chart: Chart) => {
    if (image.complete) {
      const ctx = chart.ctx;
      const { top, left, width, height } = chart.chartArea;
      // console.log("TOP: ", top);
      // console.log("LEFT: ", left);
      // console.log("RIGHT: ", width);
      // console.log("HEIGHT: ", height);

      const x = left + width / 2 - height / 2;
      const y = top + height / 2 - height / 2;
      // console.log(x);
      // console.log(y);
      ctx.drawImage(image, 32, y, width, height);
    } else {
      image.onload = () => chart.draw();
    }
  },
};

interface IChartProps {
  store: Store;
}

const OrbitalChart = (props: IChartProps) => {
  // const allActiveSatellites = props.store.getAllActiveSatelliteSatnums();
  // console.log("All active satellites: ", allActiveSatellites);

  // const datasets: {
  //   label: string;
  //   data: { x: number; y: number }[];
  //   // backgroundColor: string;
  //   satnum: string;
  //   showLine: boolean;
  //   borderColor: string;
  //   borderWidth: number;
  //   // pointBackgroundColor: string[];
  //   // pointBorderColor: string[];
  //   pointRadius: number;
  //   // pointHoverRadius: number;
  //   fill: boolean;
  //   // lineTension: number;
  //   // pointColor: string;
  //   // pointStrokeColor: string;
  // }[] = [];

  // allActiveSatellites.forEach((satellite) => {
  // let color = Math.floor(Math.random() * rgbaColors.length);

  //   if (props.store.activeSatellitesGroundTrackMap.has(satellite.satnum)) {
  //     let satData = props.store.activeSatellitesGroundTrackMap.get(
  //       satellite.satnum
  //     )?.data;
  //     if (!satData) return;

  //     satData.forEach((dataset) => {
  //       datasets.push({
  //         label: `${satellite.satnum}`,
  //         data: dataset,
  //         // backgroundColor: "blue",
  //         satnum: `${satellite.satnum}`,
  //         showLine: true,
  //         borderColor: rgbaColors[color],
  //         borderWidth: 2,
  //         // pointBackgroundColor: ["#fff"],
  //         // pointBorderColor: [],
  //         pointRadius:1,
  //         // pointHoverRadius: 15,
  //         fill: false,
  //         // lineTension: 0.4,
  //         // pointColor: "#fff",
  //         // pointStrokeColor: "#fff",
  //       });
  //     });
  //   } else {
  //     return;
  //   }
  // });
  const chartRef = useRef(null);

  useEffect(() => {
    const chart = chartRef.current;

    if (chart) {
      props.store.chart = chart;
    }
  }, []);

  return (
    <Scatter
      ref={chartRef}
      plugins={[imgPlugin]}
      options={options}
      data={{ datasets: [] }}
    />
  );
};

export default OrbitalChart;
