/**
 * ListEarthquakes RPC -- reads seeded earthquake data from Railway seed cache.
 * All external USGS API calls happen in seed-earthquakes.mjs on Railway.
 */

import type {
  SeismologyServiceHandler,
  ServerContext,
  ListEarthquakesRequest,
  ListEarthquakesResponse,
} from '../../../../src/generated/server/worldmonitor/seismology/v1/service_server';

import { getCachedJson } from '../../../_shared/redis';
import { isSelfHostedFullAccess } from '../../../_shared/self-hosted';

const SEED_CACHE_KEY = 'seismology:earthquakes:v1';

type EarthquakeCache = { earthquakes: ListEarthquakesResponse['earthquakes'] };

const USGS_FEED_URL =
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson';
const DIRECT_CACHE_MS = 5 * 60 * 1000;
let directCache: { fetchedAt: number; earthquakes: ListEarthquakesResponse['earthquakes'] } | null = null;

async function fetchDirectEarthquakes(): Promise<ListEarthquakesResponse['earthquakes']> {
  if (directCache && Date.now() - directCache.fetchedAt < DIRECT_CACHE_MS) {
    return directCache.earthquakes;
  }

  const response = await fetch(USGS_FEED_URL, {
    headers: { Accept: 'application/json', 'User-Agent': 'WorldMonitor-SelfHosted/1.0' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`USGS API error: ${response.status}`);

  const payload = await response.json() as {
    features?: Array<{
      id?: string;
      properties?: { place?: string; mag?: number; time?: number; url?: string };
      geometry?: { coordinates?: number[] };
    }>;
  };
  const earthquakes = (payload.features ?? [])
    .filter((feature) => feature.properties && feature.geometry?.coordinates)
    .map((feature) => {
      const coordinates = feature.geometry?.coordinates ?? [];
      return {
        id: String(feature.id ?? ''),
        place: String(feature.properties?.place ?? ''),
        magnitude: feature.properties?.mag ?? 0,
        depthKm: coordinates[2] ?? 0,
        location: {
          latitude: coordinates[1] ?? 0,
          longitude: coordinates[0] ?? 0,
        },
        occurredAt: feature.properties?.time ?? 0,
        sourceUrl: String(feature.properties?.url ?? ''),
      };
    });

  directCache = { fetchedAt: Date.now(), earthquakes };
  return earthquakes;
}

export const listEarthquakes: SeismologyServiceHandler['listEarthquakes'] = async (
  _ctx: ServerContext,
  req: ListEarthquakesRequest,
): Promise<ListEarthquakesResponse> => {
  const pageSize = req.pageSize || 500;
  try {
    const seedData = await getCachedJson(SEED_CACHE_KEY, true) as EarthquakeCache | null;
    let earthquakes = seedData?.earthquakes || [];
    if (earthquakes.length === 0 && isSelfHostedFullAccess()) {
      earthquakes = await fetchDirectEarthquakes();
    }
    return { earthquakes: earthquakes.slice(0, pageSize), pagination: undefined };
  } catch {
    return { earthquakes: [], pagination: undefined };
  }
};
