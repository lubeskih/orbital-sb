import 'reflect-metadata';

import express from 'express';
import Container from 'typedi';
import { SatelliteService } from './service/satellite.service';

const app = express();
const port = 3001;

app.listen(port, async () => {
    console.log(`Express is listening at http://localhost:${port}`);

    init();
});

async function init() {
    console.log('[+] Starting server ...');

    try {
        // const satelliteService = Container.get(SatelliteService);
        // satelliteService.recalculateAndUpdateSatelliteGroundTrack();

        setInterval(() => {
            const satelliteService = Container.get(SatelliteService);
            satelliteService.recalculateAndUpdateDbSatellites();
        }, 5000); // every 5 seconds

        setInterval(() => {
            const satelliteService = Container.get(SatelliteService);
            satelliteService.recalculateAndUpdateSatelliteGroundTrack();
        }, 1000 * 60 * 60 * 2); // every 2 hours
    } catch (e) {
        console.error(e);
    }
}
