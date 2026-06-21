/**
 * ListNaturalEvents RPC -- reads seeded natural disaster data from Railway seed cache.
 * All external EONET/GDACS/NHC API calls happen in seed-natural-events.mjs on Railway.
 */

import type {
  NaturalServiceHandler,
  ServerContext,
  ListNaturalEventsRequest,
  ListNaturalEventsResponse,
} from '../../../../src/generated/server/worldmonitor/natural/v1/service_server';

import { getCachedJson } from '../../../_shared/redis';
import { isSelfHostedFullAccess } from '../../../_shared/self-hosted';

const SEED_CACHE_KEY = 'natural:events:v1';
const EONET_API_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events';
const DIRECT_CACHE_MS = 5 * 60 * 1000;
let directCache: { fetchedAt: number; events: ListNaturalEventsResponse['events'] } | null = null;

const EONET_CATEGORIES = new Set([
  'severeStorms', 'wildfires', 'volcanoes', 'floods', 'landslides',
  'drought', 'dustHaze', 'snow', 'tempExtremes', 'seaLakeIce',
  'waterColor', 'manmade',
]);

async function fetchDirectNaturalEvents(days: number): Promise<ListNaturalEventsResponse['events']> {
  if (directCache && Date.now() - directCache.fetchedAt < DIRECT_CACHE_MS) {
    return directCache.events;
  }

  const safeDays = Math.max(1, Math.min(days || 30, 90));
  const response = await fetch(`${EONET_API_URL}?status=open&days=${safeDays}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'WorldMonitor-SelfHosted/1.0' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`NASA EONET API error: ${response.status}`);

  const payload = await response.json() as {
    events?: Array<{
      id?: string;
      title?: string;
      description?: string;
      closed?: string | null;
      categories?: Array<{ id?: string; title?: string }>;
      sources?: Array<{ id?: string; url?: string }>;
      geometry?: Array<{
        date?: string;
        type?: string;
        coordinates?: number[];
        magnitudeValue?: number;
        magnitudeUnit?: string;
      }>;
    }>;
  };

  const events: ListNaturalEventsResponse['events'] = [];
  for (const event of payload.events ?? []) {
    const category = event.categories?.[0];
    const categoryId = String(category?.id ?? '');
    if (!category || categoryId === 'earthquakes') continue;
    const normalizedCategory = EONET_CATEGORIES.has(categoryId) ? categoryId : 'manmade';
    const geometries = event.geometry ?? [];
    const geometry = geometries[geometries.length - 1];
    if (geometry?.type !== 'Point' || !geometry.coordinates) continue;
    const [lon = 0, lat = 0] = geometry.coordinates;
    const source = event.sources?.[0];
    events.push({
      id: String(event.id ?? ''),
      title: String(event.title ?? ''),
      description: String(event.description ?? ''),
      category: normalizedCategory,
      categoryTitle: String(category.title ?? ''),
      lat,
      lon,
      date: geometry.date ? new Date(geometry.date).getTime() : Date.now(),
      magnitude: geometry.magnitudeValue ?? 0,
      magnitudeUnit: String(geometry.magnitudeUnit ?? ''),
      sourceUrl: String(source?.url ?? ''),
      sourceName: String(source?.id ?? 'NASA EONET'),
      closed: event.closed !== null,
      forecastTrack: [],
      conePolygon: [],
      pastTrack: [],
    });
  }

  directCache = { fetchedAt: Date.now(), events };
  return events;
}

export const listNaturalEvents: NaturalServiceHandler['listNaturalEvents'] = async (
  _ctx: ServerContext,
  _req: ListNaturalEventsRequest,
): Promise<ListNaturalEventsResponse> => {
  try {
    const result = await getCachedJson(SEED_CACHE_KEY, true) as { events: ListNaturalEventsResponse['events'] } | null;
    let events = result?.events || [];
    if (events.length === 0 && isSelfHostedFullAccess()) {
      events = await fetchDirectNaturalEvents(_req.days);
    }
    return { events };
  } catch {
    return { events: [] };
  }
};
