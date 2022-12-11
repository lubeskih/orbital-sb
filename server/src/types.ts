export interface Satellite {
    name: string,
    satnum: string,
    inclination: number,
    epoch_days: number,
    latitude: number,
    longitude: number,
    orbital_period: number,
    speed: number
    tle_line_one: string,
    tle_line_two: string,
  }


export interface TLE {
  name: string,
  line_1: string,
  line_2: string,
}
