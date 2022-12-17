import { round } from "lodash";
import moment from "moment";

import worldDay from "./assets/day.png";
import worldNight from "./assets/world-night.png";

export function generateDayNightMap(): HTMLImageElement {
  let mktime = Date.now() / 1000;
  let daysInyear = 365;
  let mapOffset = 0;

  let t = moment().hour();
  let m = moment().minute();
  let s = moment().second();

  let curretntDateTime = moment().format();
  let timezoneOffset = moment().utcOffset(curretntDateTime).second();

  let time = t + m / 60 + s / 3600;

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

  pointingFromEarthToSun = pointingFromEarthToSun.add(seasonOffset);

  let earthDay = new Image();
  earthDay.src = worldDay;

  let earthNight = new Image();
  earthNight.src = worldNight;

  let maxU = earthDay.width;
  let maxV = earthDay.height;

  let doubleMaxV = maxV * 2;

  pointingFromEarthToSun.normalize(1);

  for (let u = 0; u < round(maxU); u++) {
    for (let v = 0; v < round(maxV); v++) {
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
        // draw pixels ???
      }
    }
  }

  return new Image();
}

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
    let dot = this.x * v.x + this.y * v.y + (this.z + v.z);
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
