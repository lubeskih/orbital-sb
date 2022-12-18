import { Service } from 'typedi';
import * as pg from 'pg';
import { GroundTrackSlices, Satellite } from '../types';

@Service()
class PostgresManagerService {
    pg_client: pg.Client;

    constructor() {
        this.pg_client = new pg.Client({
            host: process.env.PG_HOST,
            port: parseInt(process.env.PG_PORT),
            user: process.env.PG_USER,
            password: process.env.PG_PASSWORD,
        });

        this.pg_client.connect();

        // TODO: Check where to end properly
        // this.postgresManagerService.pg_client.end();
    }
}

interface ISupabaseRepository {
    fetchLastTLEUpdate(): Promise<string>;
    updateSatelliteElements(satellite: Satellite): Promise<void>;
    fetchTwoLineElements(): Promise<
        { name: string; tle_line_one: string; tle_line_two: string }[]
    >;
    updateSatelliteGroundTrack(
        satnum: string,
        gt: GroundTrackSlices,
    ): Promise<void>;
    updateSatellitePosition(satellite: Satellite): Promise<void>;
    insertNewSatellite(satellite: Satellite): Promise<void>;
}

@Service()
export class SupabaseRepository implements ISupabaseRepository {
    constructor(public postgresManagerService: PostgresManagerService) {}

    async fetchLastTLEUpdate(): Promise<string> {
        const text = 'SELECT last_update FROM public.settings';

        try {
            const res = await this.postgresManagerService.pg_client.query(text);
            return res.rows[0].last_update;
        } catch (e) {
            console.error(`Could not fetch settings. Error ${e.stack}`);
        }
    }

    async updateSatelliteElements(satellite: Satellite) {
        const text =
            'UPDATE public.satellite SET tle_line_one = $1, tle_line_two = $2 WHERE satnum = $3;';
        const values = [
            satellite.tle_line_one,
            satellite.tle_line_two,
            satellite.satnum,
        ];

        try {
            await this.postgresManagerService.pg_client.query(text, values);
            console.log(
                `Updated TLE set for satellite ${satellite.name} (${satellite.satnum}).`,
            );
        } catch (error) {
            console.error(
                `Cannot update TLE for satellite ${satellite.name}. Error: ${error.stack}`,
            );
        }
    }

    async fetchTwoLineElements() {
        const text =
            'SELECT name, tle_line_one, tle_line_two from public.satellite';

        // async/await
        try {
            const res = await this.postgresManagerService.pg_client.query(text);
            return res.rows;
        } catch (error) {
            console.error(
                `Cannot fetch satellite TLE sets. Error: ${error.stack}`,
            );
        }
    }

    async updateSatelliteGroundTrack(satnum: string, gt: GroundTrackSlices) {
        const gtString = JSON.stringify(gt);
        const text =
            'UPDATE public.satellite SET ground_track = $1 WHERE satnum = $2;';
        const values = [gtString, satnum];

        try {
            await this.postgresManagerService.pg_client.query(text, values);
            console.log(`Updated ground track for ${satnum}.`);
        } catch (error) {
            console.error(
                `Cannot update ground track for satellite ${satnum}. Error: ${error.stack}`,
            );
        }
    }

    async updateSatellitePosition(satellite: Satellite) {
        const text =
            'UPDATE public.satellite SET latitude = $1, longitude = $2, speed = $3 WHERE satnum = $4;';
        const values = [
            satellite.latitude,
            satellite.longitude,
            satellite.speed,
            satellite.satnum,
        ];

        try {
            await this.postgresManagerService.pg_client.query(text, values);
            console.log(
                `Updated position for ${satellite.name} (${satellite.satnum}).`,
            );
        } catch (error) {
            console.error(
                `Cannot update position for satellite ${satellite.name}. Error: ${error.stack}`,
            );
        }
    }

    async insertNewSatellite(satellite: Satellite) {
        const text = `INSERT INTO public.satellite(name, satnum, latitude, longitude, epoch_days, speed, orbital_period, tle_line_one, tle_line_two, inclination) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;
        const values = [
            satellite.name,
            satellite.satnum,
            satellite.latitude,
            satellite.longitude,
            satellite.epoch_days,
            satellite.speed,
            satellite.orbital_period,
            satellite.tle_line_one,
            satellite.tle_line_two,
            satellite.inclination,
        ];

        // async/await
        try {
            const res = await this.postgresManagerService.pg_client.query(
                text,
                values,
            );
        } catch (error) {
            console.error(
                `Cannot upsert satellite ${satellite.name}. Error: ${error.stack}`,
            );
        }
    }
}
