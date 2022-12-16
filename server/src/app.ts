import * as supabase from '@supabase/supabase-js';
import express from 'express';
import * as sgp from 'sgp4';
import fetch from 'cross-fetch';

import {
    calculateSatelliteData,
    calculateSatelliteGroundTrack,
    parseElements,
    prepareSatelliteObject,
} from './util';
import { Satellite } from './types';

import * as pg from 'pg';

const pg_client = new pg.Client({
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_PORT),
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
});

const app = express();
const port = 3000;

let supabaseUrl = process.env.SUPABASE_URL;
const supabaseApiKey = process.env.SUPABASE_API_KEY;
const supabaseSecret = process.env.SUPABASE_SECRET;

const supabaseClient = supabase.createClient(supabaseUrl, supabaseApiKey, {
    auth: {
        persistSession: true,
    },
});

async function fetchServerSettings() {
    const text = 'SELECT last_update FROM public.settings';

    try {
        const res = await pg_client.query(text);
        return res.rows[0].last_update;
    } catch (e) {
        console.log(`Could not fetch settings. Error ${e.stack}`);
    }
}

async function init() {
    console.log('[+] Starting server ...');

    console.log('[+] Connecting to PostgreSQL ...');
    await pg_client.connect();

    await recalculateAndUpdateSatelliteGroundTrack();
    // recalculateAndUpdateDbSatellites();
    // setInterval(recalculateAndUpdateDbSatellites, 5000);
    // setInterval(updateTleSets, 1000 * 60 * 60 * 5);
}

app.listen(3001, async () => {
    console.log(`Express is listening at http://localhost:${port}`);

    init();
});

function shouldUpdateTleDatabase(last_update: Date): boolean {
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

async function updateTleSets() {
    console.log('[+] Fetching app settings from server ...');
    const settings = await fetchServerSettings();
    let last_update = new Date(settings[0].last_update + 'Z');

    if (!shouldUpdateTleDatabase(last_update)) return;

    let host = 'https://celestrak.org';
    let path = '/NORAD/elements/gp.php?GROUP=musson&FORMAT=tle';

    let res = await fetch(host + path);
    let tleData = await res.text();

    const sats = parseElements(tleData);

    const satellites = sats.map((satellite) =>
        prepareSatelliteObject(
            satellite.name,
            satellite.line_1,
            satellite.line_2,
        ),
    );

    for (let i = 0; i < satellites.length; i++) {
        updateSatelliteElements(satellites[i]);
    }
}

async function recalculateAndUpdateSatelliteGroundTrack() {
    try {
        const tleSets = await fetchTwoLineElements();

        for (let i = 0; i < tleSets.length; i++) {
            const set = tleSets[i];

            let satellite = prepareSatelliteObject(
                set.name,
                set.tle_line_one,
                set.tle_line_two,
            );

            // calculate satellite data
            const calculatedSatelliteGroundTrack =
                calculateSatelliteGroundTrack(satellite);

            // TODO: UPDATE groundtrack per satellite (jsonb)
        }
    } catch (error) {
        console.error(
            `Error while updating satellite ground track. Error: ${error}`,
        );
    }
}

async function recalculateAndUpdateDbSatellites() {
    // fetch settings
    try {
        const tleSets = await fetchTwoLineElements();

        for (let i = 0; i < tleSets.length; i++) {
            const set = tleSets[i];

            let satellite = prepareSatelliteObject(
                set.name,
                set.tle_line_one,
                set.tle_line_two,
            );

            // calculate satellite data
            const calculatedSatellitePosition = await calculateSatelliteData(
                satellite,
            );

            // update satellite
            await updateSatellitePosition(calculatedSatellitePosition);
        }
    } catch (error) {
        console.error(
            `Error while updating satellite positions. Error: ${error}`,
        );
    }
}

async function updateSatelliteElements(satellite: Satellite) {
    const text =
        'UPDATE public.satellite SET tle_line_one = $1, tle_line_two = $2 WHERE satnum = $3;';
    const values = [
        satellite.tle_line_one,
        satellite.tle_line_two,
        satellite.satnum,
    ];

    try {
        await pg_client.query(text, values);
        console.log(
            `Updated TLE set for satellite ${satellite.name} (${satellite.satnum}).`,
        );
    } catch (error) {
        console.error(
            `Cannot update TLE for satellite ${satellite.name}. Error: ${error.stack}`,
        );
    }
}

async function updateSatellitePosition(satellite: Satellite) {
    const text =
        'UPDATE public.satellite SET latitude = $1, longitude = $2, speed = $3 WHERE satnum = $4;';
    const values = [
        satellite.latitude,
        satellite.longitude,
        satellite.speed,
        satellite.satnum,
    ];

    try {
        await pg_client.query(text, values);
        console.log(
            `Updated position for ${satellite.name} (${satellite.satnum}).`,
        );
    } catch (error) {
        console.error(
            `Cannot update position for satellite ${satellite.name}. Error: ${error.stack}`,
        );
    }
}

// fetch all TLE from satellite tabl
async function fetchTwoLineElements() {
    const text =
        'SELECT name, tle_line_one, tle_line_two from public.satellite';

    // async/await
    try {
        const res = await pg_client.query(text);
        return res.rows;
    } catch (error) {
        console.error(`Cannot fetch satellite TLE sets. Error: ${error.stack}`);
    }
}

async function seedSatelliteDb() {
    let host = 'https://celestrak.org';
    let path = '/NORAD/elements/gp.php?GROUP=musson&FORMAT=tle';

    let res = await fetch(host + path);
    let tleData = await res.text();

    const sats = parseElements(tleData);

    const satellites = sats.map((satellite) =>
        prepareSatelliteObject(
            satellite.name,
            satellite.line_1,
            satellite.line_2,
        ),
    );

    for (let i = 0; i < satellites.length; i++) {
        insertSatellite(satellites[i]);
    }
}

async function insertSatellite(satellite: Satellite) {
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
        const res = await pg_client.query(text, values);
        // console.log(`Satellite ${res.rows[0].name} INSERTED.`);
    } catch (error) {
        console.error(
            `Cannot upsert satellite ${satellite.name}. Error: ${error.stack}`,
        );
    }
}
