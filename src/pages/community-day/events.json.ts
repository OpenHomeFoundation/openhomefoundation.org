// Same-origin feed of Community Day meetups, polled by the map on
// /community-day (see src/scripts/find-a-meetup.js).
//
// The page itself is prerendered, so its build-time copy of the list is
// frozen at deploy time; this route is what keeps the map current between
// deploys. It also has to exist as a proxy rather than the browser calling
// the upstream API directly: that API only sends
// access-control-allow-origin: https://www.openhomefoundation.org, so a
// direct fetch fails on localhost and on deploy previews.
import type { APIRoute } from "astro";
import { fetchMeetupEvents } from "../../lib/community-day-events.js";

export const prerender = false;

export const GET: APIRoute = async () => {
  let events;
  try {
    events = await fetchMeetupEvents();
  } catch (error) {
    console.error("Failed to fetch Community Day events", error);
    return new Response(JSON.stringify({ error: "upstream unavailable" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ events }), {
    headers: {
      "Content-Type": "application/json",
      // Upstream refreshes every 15 minutes; a 5-minute edge cache keeps the
      // list close to live without every visitor costing an upstream call.
      "Cache-Control": "public, max-age=300, stale-while-revalidate=900",
    },
  });
};
