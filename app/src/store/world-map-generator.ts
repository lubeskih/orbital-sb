import moment from "moment";

import worldDay from "../assets/day.png";
import worldNight from "../assets/world-night.png";

async function loadImage(url: string, elem: any) {
  return new Promise((resolve, reject) => {
    elem.onload = () => resolve(elem);
    elem.onerror = reject;
    elem.src = url;
  });
}

// generates day/night map of the earth to be displayed on the chart
// Uses the mathemathics from http://www.edesign.nl/2009/05/14/math-behind-a-world-sunlight-map/
export async function generateDayNightMap() {
  let daysInyear = 365;
  let mapOffset = 0;

  let t = moment().hour();
  let m = moment().minute();
  let s = moment().second();

  let timezoneOffset = 3600;

  let time = t + m / 60 + s / timezoneOffset;

  time = time + 24 + 6 - timezoneOffset / 3600 - mapOffset;

  let dayOfYear = moment().dayOfYear();

  while (time > 24) {
    time = time - 24;
  }

  time = time / 24;

  let pointingFromEarthToSun = new Vec3(
    Math.sin(2 * Math.PI * time),
    0,
    Math.cos(2 * Math.PI * time)
  );
  let tilt = 23.5 * Math.cos((2 * Math.PI * (dayOfYear - 173)) / daysInyear);
  let seasonOffset = new Vec3(0, Math.tan(Math.PI * 2 * (tilt / 360)), 0);

  // console.log("X", pointingFromEarthToSun.x);
  // console.log("Y", pointingFromEarthToSun.y);
  // console.log("Z", pointingFromEarthToSun.z);

  // console.log("ttlt", tilt);

  // console.log("offset seasons", seasonOffset);

  pointingFromEarthToSun = pointingFromEarthToSun.add(seasonOffset);

  let earthDay = new Image(2048, 1024);
  let earthNight = new Image(2048, 1024);

  await loadImage(worldDay, earthDay);
  await loadImage(worldNight, earthNight);

  let maxU = 2048;
  let maxV = 1024;

  let doubleMaxV = maxV * 2;

  // console.log("MAX", maxU, maxV, doubleMaxV);

  pointingFromEarthToSun.normalize(1);

  // console.log("NEWEST ",  pointingFromEarthToSun);

  let canvasDay = document.createElement("CANVAS") as HTMLCanvasElement;
  canvasDay.id = "1";
  let canvasNight = document.createElement("CANVAS") as HTMLCanvasElement;
  canvasNight.id = "2";

  let ctxDay = canvasDay.getContext("2d") as CanvasRenderingContext2D;
  let ctxNight = canvasNight.getContext("2d") as CanvasRenderingContext2D;

  ctxDay.canvas.width = 2048;
  ctxDay.canvas.height = 1024;

  ctxNight.canvas.width = 2048;
  ctxNight.canvas.height = 1024;

  ctxDay.drawImage(earthDay, 0, 0, canvasDay.width, canvasDay.height);
  ctxNight.drawImage(earthNight, 0, 0, canvasNight.width, canvasNight.height);

  let dayImageData = ctxDay.getImageData(
    0,
    0,
    canvasDay.width,
    canvasDay.height
  ) as any;

  let nightImageData = ctxNight.getImageData(
    0,
    0,
    canvasNight.width,
    canvasNight.height
  ) as any;

  for (let u = 0; u < 2048; u++) {
    for (let v = 0; v < 1024; v++) {
      let phi = (v / doubleMaxV - 1) * (2 * Math.PI); // latitude
      let theta = (u / maxU) * (2 * Math.PI); // longitude

      let x = Math.sin(phi) * Math.cos(theta);
      let y = Math.cos(phi);
      let z = Math.sin(phi) * Math.sin(theta);

      let earthNormal = new Vec3(x, y, z);
      earthNormal.normalize(1);

      let angle_between_surface_and_sunlight =
        pointingFromEarthToSun.dot(earthNormal);

      if (angle_between_surface_and_sunlight <= -0.1) {
        let colorIndices = getColorIndicesForCoord(u, v, 2048);
        dayImageData.data[colorIndices[0]] =
          nightImageData.data[colorIndices[0]];
        dayImageData.data[colorIndices[1]] =
          nightImageData.data[colorIndices[1]];
        dayImageData.data[colorIndices[2]] =
          nightImageData.data[colorIndices[2]];
        dayImageData.data[colorIndices[3]] =
          nightImageData.data[colorIndices[3]];
      }
    }
  }

  ctxDay.putImageData(dayImageData, 0, 0);
  let base64URI = canvasDay.toDataURL("image/png");

  let i = new Image(2048, 1024);
  i.src = base64URI;
  await loadImage(base64URI, i);

  return i;
}

const getColorIndicesForCoord = (x: number, y: number, width: number) => {
  const red = y * (width * 4) + x * 4;
  return [red, red + 1, red + 2, red + 3];
};

class Vec3 {
  public x = 0;
  public y = 0;
  public z = 0;

  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  public dot(v: Vec3) {
    let dot = this.x * v.x + this.y * v.y + this.z * v.z;
    return dot;
  }

  public add(v: Vec3) {
    return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  public minus(v: Vec3) {
    return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  public times(multiplier: number) {
    return new Vec3(
      this.x * multiplier,
      this.y * multiplier,
      this.z * multiplier
    );
  }

  public normalize(to: number) {
    let invLength = to / this.length();
    this.x *= invLength;
    this.y *= invLength;
    this.z *= invLength;
  }

  public lengthSquared() {
    return Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2);
  }

  public length() {
    return Math.sqrt(this.lengthSquared());
  }

  public copy() {
    return new Vec3(this.x, this.y, this.z);
  }
}
