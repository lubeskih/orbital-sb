import { observer } from "mobx-react-lite";
import { Scatter } from "react-chartjs-2";
// Assuming logo.png is in the same folder as JS file
import day from "../assets/day.png";

import React from "react";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Chart,
} from "chart.js";

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
  legend: {
    display: false,
  },
};

export const data = {
  datasets: [
    {
      label: "A dataset",
      data: [{ x: 23.23, y: 56.32 }],
      backgroundColor: "rgba(255, 99, 132, 1)",
    },
  ],
};

const image = new Image();
image.src = day;
const imgPlugin = {
  id: "custom_canvas_background_image",
  beforeDraw: (chart: Chart) => {
    if (image.complete) {
      const ctx = chart.ctx;
      const { top, left, width, height } = chart.chartArea;
      console.log("TOP: ", top);
      console.log("LEFT: ", left);
      console.log("RIGHT: ", width);
      console.log("HEIGHT: ", height);

      const x = left + width / 2 - height / 2;
      const y = top + height / 2 - height / 2;
      console.log(x);
      console.log(y);
      ctx.drawImage(image, 32, y, width, height);
    } else {
      image.onload = () => chart.draw();
    }
  },
};

const OrbitalChart = observer(() => {
  return <Scatter plugins={[imgPlugin]} options={options} data={data} />;
});

export default OrbitalChart;
