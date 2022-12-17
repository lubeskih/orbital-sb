// @ts-nocheck
import { Scatter } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";

import day from "../assets/day.png";

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
        console.log("FROM CTX", context.dataset.name);
        return context.dataset.name;
      },
      color: "#000",
      backgroundColor: "rgba(255,255,255,0.5)",
      padding: 1,
      align: "bottom",
      offset: 15,
      font: {
        family: "Ubuntu Mono",
      },
    },
  },
  hover: { mode: null },
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

      const x = left + width / 2 - height / 2;
      const y = top + height / 2 - height / 2;

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
      plugins={[imgPlugin, ChartDataLabels]}
      options={options}
      data={{ datasets: [] }}
    />
  );
};

export default OrbitalChart;
