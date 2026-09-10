// Shared source of Community Day meetups for both the build-time render of
// FindAMeetup.astro and the /community-day/events.json endpoint its client
// script polls, so the two can never drift into different shapes.

const EVENTS_API_URL = "https://web-api.openhomefoundation.org/events/ohf-community-day";

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  hour: "2-digit",
  minute: "2-digit",
  timeZoneName: "short",
});

function toMapEvent(event) {
  const address = (event.address ?? []).map((line) => line.trim()).filter(Boolean);
  const place = address.slice(Math.max(1, address.length - 2));

  return {
    id: event.id,
    title: address[0] ?? event.summary,
    starts: timeFormatter.format(new Date(event.start)),
    location: place.length > 0 ? place.join(", ") : null,
    url: event.url,
    lat: event.latitude,
    lng: event.longitude,
  };
}

export async function fetchMeetupEvents() {
  const response = await fetch(EVENTS_API_URL);
  if (!response.ok) throw new Error(`${EVENTS_API_URL} responded ${response.status}`);

  const data = await response.json();
  const now = Date.now();

  return data.events
    .filter((event) => new Date(event.end || event.start).getTime() >= now)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .map(toMapEvent);
}
