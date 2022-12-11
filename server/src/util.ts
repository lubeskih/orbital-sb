import * as sgp from "sgp4";
import { Satellite, TLE } from './types';

export function parseElements(data: string) {
    let name = "", line_1 = "", line_2 = "";
    const sats: TLE[] = [];

    const lines = data.split('\n');

    lines.forEach(line => {
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
                line_2
            });

            name = "";
            line_1 = "";
            line_2 = "";
        }
    })

    return sats;
}

export async function calculateSatelliteData(satellite: any): Promise<Satellite> {
    // Current time
    var now = new Date();
    
    // This will contain ECI (http://en.wikipedia.org/wiki/Earth-centered_inertial) coordinates of position and velocity of the satellite
    var positionAndVelocity = sgp.propogate(satellite, now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
    
    // GMST required to get Lat/Long
    var gmst = sgp.gstimeFromDate(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
    
    // Geodetic coordinates
    var geodeticCoordinates = sgp.eciToGeodetic(positionAndVelocity.position, gmst);
    
    // Coordinates in degrees
    var longitude = sgp.degreesLong(geodeticCoordinates.longitude);
    var latitude = sgp.degreesLat(geodeticCoordinates.latitude);
    
    // Prints current speed of satellite in km/s
    const speed = geodeticCoordinates.velocity;
    
    // Prints orbital period of satellite in minutes
    // 2pi * sqrt(Relative Height / Gravity of Earth * Mass of Earth)
    const orbital_period = ((2 * Math.PI) * (geodeticCoordinates.height + 6378.135)) * (Math.sqrt((geodeticCoordinates.height + 6378.135)/398600.8)) / 60;

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
        speed
    } as Satellite);
}