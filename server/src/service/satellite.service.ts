import { Service } from 'typedi';
import moment from 'moment';
import * as sgp from 'sgp4';
import { GroundTrack, GroundTrackSlices, Satellite, TLE } from '../types';
import { SupabaseRepository } from '../repository/supabase.repository';
import { fetch } from 'cross-fetch';

interface ISatelliteService {
    orbitIsPrograde(inclination: number): boolean;
    calculateSatelliteGroundTrack(satellite: Satellite): GroundTrackSlices;
    parseElements(data: string): TLE[];
    calculateSatelliteData(satellite: any): Promise<Satellite>;
    updateTleSets(): Promise<void>;
    recalculateAndUpdateSatelliteGroundTrack(): Promise<void>;
    seedSatelliteDb(): Promise<void>;
    recalculateAndUpdateDbSatellites(): Promise<void>;
}

@Service()
export class SatelliteService implements ISatelliteService {
    constructor(public supabaseRepository: SupabaseRepository) {}

    async calculateSatelliteData(satellite: any) {
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

    orbitIsPrograde(inclination: number) {
        return inclination >= 0 && inclination < 90;
    }

    async recalculateAndUpdateSatelliteGroundTrack() {
        try {
            const tleSets =
                await this.supabaseRepository.fetchTwoLineElements();

            for (let i = 0; i < tleSets.length; i++) {
                const set = tleSets[i];

                let satellite = this.prepareSatelliteObject(
                    set.name,
                    set.tle_line_one,
                    set.tle_line_two,
                );

                // calculate satellite data
                const calculatedSatelliteGroundTrack =
                    this.calculateSatelliteGroundTrack(satellite);

                await this.supabaseRepository.updateSatelliteGroundTrack(
                    satellite.satnum,
                    calculatedSatelliteGroundTrack,
                );

                console.log('Done updating satellite ground track.');
            }
        } catch (error) {
            console.error(
                `Error while updating satellite ground track. Error: ${error}`,
            );
        }
    }

    async recalculateAndUpdateDbSatellites() {
        // fetch settings
        try {
            const tleSets =
                await this.supabaseRepository.fetchTwoLineElements();

            for (let i = 0; i < tleSets.length; i++) {
                const set = tleSets[i];

                let satellite = this.prepareSatelliteObject(
                    set.name,
                    set.tle_line_one,
                    set.tle_line_two,
                );

                // calculate satellite data
                const calculatedSatellitePosition =
                    await this.calculateSatelliteData(satellite);

                // update satellite
                await this.supabaseRepository.updateSatellitePosition(
                    calculatedSatellitePosition,
                );
            }
        } catch (error) {
            console.error(
                `Error while updating satellite positions. Error: ${error}`,
            );
        }
    }

    // const data: GroundTrackSlices = [
    //   // first screen
    //   [{x: 1, y: 2}, {x: 2, y: 3}, {x: 3, y: 4}, {x: 5, y: 6}],
    //   // second screen
    //   [{x: 1, y: 2}, {x: 2, y: 3}, {x: 3, y: 4}, {x: 5, y: 6}],
    //   // third screen
    //   [{x: 1, y: 2}, {x: 2, y: 3}, {x: 3, y: 4}, {x: 5, y: 6}],
    //   // fourth screen
    // ]
    calculateSatelliteGroundTrack(satellite: Satellite) {
        // calculate full gt
        const fullGroundTrack: GroundTrack = this.calculateFullGroundTrack(
            satellite.name,
            satellite.tle_line_one,
            satellite.tle_line_two,
        );
        // slice gt
        const slices: GroundTrackSlices = this.sliceGroundTrack(
            satellite,
            fullGroundTrack,
        );

        // return slices
        return slices;
    }

    parseElements(data: string) {
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

    prepareSatelliteObject(
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

    async updateTleSets() {
        console.log('[+] Fetching app settings from server ...');
        let lastUpdate = await this.supabaseRepository.fetchLastTLEUpdate();
        let date = new Date(lastUpdate);

        if (!this.shouldUpdateTleDatabase(date)) return;

        let host = 'https://celestrak.org';
        let path = '/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle';

        let res = await fetch(host + path);
        let tleData = await res.text();

        const sats = this.parseElements(tleData);

        const satellites = sats.map((satellite) =>
            this.prepareSatelliteObject(
                satellite.name,
                satellite.line_1,
                satellite.line_2,
            ),
        );

        for (let i = 0; i < satellites.length; i++) {
            this.supabaseRepository.updateSatelliteElements(satellites[i]);
        }
    }

    async seedSatelliteDb() {
        console.log('[+] Seeding database with satellite data.');
        let host = 'https://celestrak.org';
        let path = '/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle';

        let res = await fetch(host + path);
        let tleData = await res.text();

        const sats = this.parseElements(tleData);

        const satellites = sats.map((satellite) =>
            this.prepareSatelliteObject(
                satellite.name,
                satellite.line_1,
                satellite.line_2,
            ),
        );

        for (let i = 0; i < satellites.length; i++) {
            console.log(`[+] Inserting ${satellites[i].name} ...`);
            this.supabaseRepository.insertNewSatellite(satellites[i]);
        }

        console.log('[+] Done.');
    }

    // Private
    private shouldUpdateTleDatabase(last_update: Date): boolean {
        let now = new Date();

        let next_update_time = new Date(
            last_update.setHours(last_update.getHours() + 3),
        );

        console.log('next update', next_update_time);

        if (now.getTime() > next_update_time.getTime()) {
            console.log(
                'Last updated happened more than 3 hours ago. Updating ...',
            );
            return true;
        } else {
            const minutes =
                (next_update_time.getTime() - now.getTime()) / 1000 / 60;
            console.log(
                `No update required. Time left before next update: ${Math.round(
                    minutes,
                )} minutes (${Math.round(minutes) / 60} hours).`,
            );
            return false;
        }
    }

    private calculateFullGroundTrack(
        name: string,
        tle_1: string,
        tle_2: string,
    ): GroundTrack {
        const groundTrack: GroundTrack = [];
        let minutesInTheFuture = 180;

        let satellite = this.prepareSatelliteObject(name, tle_1, tle_2);

        // time loop
        // Current time
        let now = new Date();

        for (let p = 0; p <= minutesInTheFuture * 2; p++) {
            now.setMinutes(now.getMinutes(), p * 0.5);
            const timeStamp = moment
                .utc(now)
                .format('MMM Do YY, h:mm:ss a (UTC)');

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

            groundTrack.push({
                x: longitude,
                y: latitude,
                timeStamp: timeStamp,
            });
        }

        return groundTrack;
    }

    private sliceGroundTrack(
        satellite: Satellite,
        fullGroundTrack: GroundTrack,
    ): GroundTrackSlices {
        let groundTrackSlices: GroundTrackSlices = [];

        if (this.orbitIsPrograde(satellite.inclination)) {
            // prograde
            let start = 0;
            let end = 0;
            let last = false;

            // read until X < X + 1
            // if X > X+1; slice
            for (let i = 0; i < fullGroundTrack.length - 1; i++) {
                let coordinateSlice: {
                    x: number;
                    y: number;
                    timeStamp: string;
                }[] = [];

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
                let coordinateSlice: {
                    x: number;
                    y: number;
                    timeStamp: string;
                }[] = [];

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
}
