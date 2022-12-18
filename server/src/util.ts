import moment from 'moment';
import * as sgp from 'sgp4';
import { Satellite, TLE } from './types';

export function parseElements(data: string) {
    let name = '',
        line_1 = '',
        line_2 = '';
    const sats: TLE[] = [];

    const lines = data.split('\n');

    lines.forEach((line) => {
        line = line.slice(0, -1);
        let first_char = parseInt(line[0]);
        let is_a_number = !isNaN(first_char);

        if (!line) {
            // nothing
        } else if (!name && !is_a_number && line.length < 69) {
            name = line.trim(); // Satellite name
        } else if (is_a_number) {
            if (first_char === 1 && line.length === 69) {
                line_1 = line;
            } else if (first_char === 2 && line.length === 69) {
                line_2 = line;
            }
        }

        if (name && line_1 && line_2) {
            sats.push({
                name,
                line_1,
                line_2,
            });

            name = '';
            line_1 = '';
            line_2 = '';
        }
    });

    return sats;
}

export async function calculateSatelliteData(
    satellite: any,
): Promise<Satellite> {
    // Current time
    var now = new Date();

    // This will contain ECI (http://en.wikipedia.org/wiki/Earth-centered_inertial) coordinates of position and velocity of the satellite
    var positionAndVelocity = sgp.propogate(
        satellite,
        now.getUTCFullYear(),
        now.getUTCMonth() + 1,
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds(),
    );

    // GMST required to get Lat/Long
    var gmst = sgp.gstimeFromDate(
        now.getUTCFullYear(),
        now.getUTCMonth() + 1,
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds(),
    );

    // Geodetic coordinates
    var geodeticCoordinates = sgp.eciToGeodetic(
        positionAndVelocity.position,
        gmst,
    );

    // Coordinates in degrees
    var longitude = sgp.degreesLong(geodeticCoordinates.longitude);
    var latitude = sgp.degreesLat(geodeticCoordinates.latitude);

    // Prints current speed of satellite in km/s
    const speed = geodeticCoordinates.velocity;

    // Prints orbital period of satellite in minutes
    // 2pi * sqrt(Relative Height / Gravity of Earth * Mass of Earth)
    const orbital_period =
        (2 *
            Math.PI *
            (geodeticCoordinates.height + 6378.135) *
            Math.sqrt((geodeticCoordinates.height + 6378.135) / 398600.8)) /
        60;

    return Promise.resolve({
        tle_line_one: satellite.tle_line_one,
        tle_line_two: satellite.tle_line_two,
        name: satellite.name,
        satnum: satellite.satellite_number,
        inclination: satellite.inclination,
        epoch_days: satellite.epoch_days,
        latitude,
        longitude,
        orbital_period,
        speed,
    } as Satellite);
}

export type GroundTrackSlices = {
    x: number;
    y: number;
    timeStamp: string;
}[][];

export type GroundTrack = {
    x: number;
    y: number;
    timeStamp: string;
}[];

// const data: GroundTrackSlices = [
//   // first screen
//   [{x: 1, y: 2}, {x: 2, y: 3}, {x: 3, y: 4}, {x: 5, y: 6}],
//   // second screen
//   [{x: 1, y: 2}, {x: 2, y: 3}, {x: 3, y: 4}, {x: 5, y: 6}],
//   // third screen
//   [{x: 1, y: 2}, {x: 2, y: 3}, {x: 3, y: 4}, {x: 5, y: 6}],
//   // fourth screen
// ]

export function calculateSatelliteGroundTrack(satellite: Satellite) {
    // calculate full gt
    const fullGroundTrack: GroundTrack = calculateFullGroundTrack(
        satellite.name,
        satellite.tle_line_one,
        satellite.tle_line_two,
    );

    // slice gt
    const slices: GroundTrackSlices = sliceGroundTrack(
        satellite,
        fullGroundTrack,
    );

    // return slices
    return slices;
}

export function sliceGroundTrack(
    satellite: Satellite,
    fullGroundTrack: GroundTrack,
): GroundTrackSlices {
    let groundTrackSlices: GroundTrackSlices = [];

    if (orbitIsPrograde(satellite.inclination)) {
        // prograde
        let start = 0;
        let end = 0;
        let last = false;

        // read until X < X + 1
        // if X > X+1; slice
        for (let i = 0; i < fullGroundTrack.length - 1; i++) {
            let coordinateSlice: { x: number; y: number; timeStamp: string }[] =
                [];

            let next: number;

            if (i + 1 === fullGroundTrack.length - 1) last = true;

            let current = fullGroundTrack[i].x;
            next = fullGroundTrack[i + 1].x;

            if (current > next || last) {
                end = i + 1;

                // slice
                coordinateSlice = fullGroundTrack.slice(start, end);
                groundTrackSlices.push(coordinateSlice);

                start = end;
                end = 0;
            }
        }
    } else {
        // retrograde
        let start = 0;
        let end = 0;
        let last = false;

        // read until X > X+1
        // if X < X+1; slice

        for (let i = 0; i < fullGroundTrack.length - 1; i++) {
            let coordinateSlice: { x: number; y: number; timeStamp: string }[] =
                [];

            let next: number;
            if (i + 1 === fullGroundTrack.length - 1) last = true; // workaround

            let current = fullGroundTrack[i].x;
            next = fullGroundTrack[i + 1].x;

            if (current < next) {
                end = i + 1;

                coordinateSlice = fullGroundTrack.slice(start, end);
                groundTrackSlices.push(coordinateSlice);

                // reset
                start = end;
                end = 0;
            }
        }
    }

    return groundTrackSlices;
}

export function calculateFullGroundTrack(
    name: string,
    tle_1: string,
    tle_2: string,
): GroundTrack {
    const groundTrack: GroundTrack = [];
    let minutesInTheFuture = 180;

    let satellite = prepareSatelliteObject(name, tle_1, tle_2);

    // time loop
    // Current time
    let now = new Date();

    for (let p = 0; p <= minutesInTheFuture * 2; p++) {
        now.setMinutes(now.getMinutes(), p * 0.5);
        const timeStamp = moment.utc(now).format('MMM Do YY, h:mm:ss a (UTC)');

        // This will contain ECI (http://en.wikipedia.org/wiki/Earth-centered_inertial) coordinates of position and velocity of the satellite
        let positionAndVelocity = sgp.propogate(
            satellite,
            now.getUTCFullYear(),
            now.getUTCMonth() + 1,
            now.getUTCDate(),
            now.getUTCHours(),
            now.getUTCMinutes(),
            now.getUTCSeconds(),
        );

        // GMST required to get Lat/Long
        let gmst = sgp.gstimeFromDate(
            now.getUTCFullYear(),
            now.getUTCMonth() + 1,
            now.getUTCDate(),
            now.getUTCHours(),
            now.getUTCMinutes(),
            now.getUTCSeconds(),
        );

        // Geodetic coordinates
        let geodeticCoordinates = sgp.eciToGeodetic(
            positionAndVelocity.position,
            gmst,
        );

        // Coordinates in degrees
        let longitude = sgp.degreesLong(geodeticCoordinates.longitude);
        let latitude = sgp.degreesLat(geodeticCoordinates.latitude);

        groundTrack.push({ x: longitude, y: latitude, timeStamp: timeStamp });
    }

    return groundTrack;
}

export function orbitIsPrograde(inclination: number) {
    return inclination >= 0 && inclination < 90;
}

export function prepareSatelliteObject(
    name: string,
    tle_line_one: string,
    tle_line_two: string,
): Satellite & Record<string, any> {
    let constants = sgp.twoline2rv(tle_line_one, tle_line_two, sgp.wgs84());

    constants.name = name;
    constants.tle_line_one = tle_line_one;
    constants.tle_line_two = tle_line_two;
    constants.inclination = constants.inclo;
    constants.satellite_number = constants.satnum;
    constants.epoch_days = constants.satnum;
    constants.latitude = 0;
    constants.longitude = 0;

    return constants;
}
