import * as supabase from '@supabase/supabase-js';
import express from 'express';
import * as sgp from "sgp4";
import fetch from 'cross-fetch';

import { calculateSatelliteData, parseElements } from './util';
import { Satellite } from './types';

const app = express();
const port = 3000;

let supabaseUrl = process.env.SUPABASE_URL;
const supabaseApiKey = process.env.SUPABASE_API_KEY
const supabaseSecret = process.env.SUPABASE_SECRET

console.log(supabaseUrl)
const client = supabase.createClient(supabaseUrl, supabaseApiKey, {
  auth: {
    persistSession: true
  },
});

app.listen((port), () => {
  // return console.log(`Express is listening at http://localhost:${port}`);
  // await fetch_tle(client);
  seedSatellites(client);
  console.log("aaa");
  // register client

  // make connection

  // async calculate_tle_position
  // async calculate_ground_track
});

// fetch all tle
async function fetch_tle(client: supabase.SupabaseClient) {
  const { data, error } = await client
  .from('ground_station')
  .select().limit(10);

  if (error) {
    console.error("Cannot fetch data.");
    return;
  }

  console.log("Fetched data: ")
  console.log(data);

}

async function seedSatellites(client: supabase.SupabaseClient) {

  let host = "https://celestrak.org";
  let path = "/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle";

  let res = await fetch(host + path);
  let tleData = await res.text();

  const sats = parseElements(tleData);

  const satellites = sats.map(satellite => {
    let constants = sgp.twoline2rv(satellite.line_1, satellite.line_2, sgp.wgs84())

    constants.name = satellite.name;
    constants.tle_line_one = satellite.line_1;
    constants.tle_line_two = satellite.line_2;

    return constants;
  });

  let db_satellites = satellites.map((satellite) => 
   ({
      ...satellite,
      name: satellite.name,
      latitude: 0,
      longitude: 0,
      inclination: satellite.inclo,
      satellite_number: satellite.satnum,
      epoch_days: satellite.epochdays,
    })
  );

  for (let i = 0; i < db_satellites.length; i++) {
    let data = await calculateSatelliteData(db_satellites[i]);

    // upsert to supabase
    upsertSatellite(data);

    console.log("----");
    console.log(data);
    console.log('----');
  }

  // await Promise.all(db_satellites);
  // calculateSatellitePosition(db_satellites[0], 0);

  // await Promise.all([...db_satellites]);
  // name
  // lat  (calculate)
  // long (calculate)
  // inclo (precision)
  // satnum (text)
  // epochdays (to int)

  // console.log(sats);


  // console.log("Seeding database...")
  // sats.forEach(async satellite => 
  //   {
  //   console.log(`Inserting ${satellite.name}`);
    // const { data, error } = await client.from('TLE').upsert({
    //   name: satellite.name,
    //   tle_line_one: satellite.line_1,
    //   tle_line_two: satellite.line_2,
    // });

  //   if (error) console.error(error);

  //   console.log(data);
// });

console.log("Done.");
}

async function upsertSatellite(satellite: Satellite) {
  const { data, error } = await client.from('satellite').upsert({
    name: satellite.name,
    satnum: satellite.satnum,
    latitude: satellite.latitude,
    longitude: satellite.longitude,
    epoch_days: satellite.epoch_days,
    speed: satellite.speed,
    orbital_period: satellite.orbital_period,
    tle_line_one: satellite.tle_line_one,
    tle_line_two: satellite.tle_line_two,
    inclination: satellite.inclination,
  });

  if (error) {
    console.error(`Cannot upsert satellite ${satellite.name}. Error: ${error.message}. Hint: ${error.hint}`);
  }

  console.log(data);
}
