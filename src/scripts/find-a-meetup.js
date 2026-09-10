import L from "leaflet";

// The page is prerendered, so the embedded list is whatever the feed held at
// deploy time. Fetch the live list first (overlapping the plugin import) and
// fall back to the embedded one only if that fails.
const latestEvents = fetch("/community-day/events.json")
  .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
  .then((data) => (Array.isArray(data.events) ? data.events : Promise.reject("bad payload")))
  .catch(() => null);

window.L = L;
await import("leaflet-gesture-handling");

const mapContainer = document.getElementById("find-a-meetup-map");
const eventsDataEl = document.getElementById("find-a-meetup-events");
const section = document.querySelector("[data-find-a-meetup]");
const events = (await latestEvents) ?? (eventsDataEl ? JSON.parse(eventsDataEl.textContent) : []);

section?.classList.toggle("has-events", events.length > 0);

// Auto-fit ceiling: a cluster of events in one country (or a single event)
// would otherwise fit to street level. The zoom controls stay unconstrained,
// so anyone can zoom in past this themselves.
const FIT_MAX_ZOOM = 5;

// Quarter-level zoom steps. The floor zoom only has to be high enough for the
// world to span the container's width; rounding it up to a whole level made
// the world up to twice as tall as necessary, and a wide north–south spread
// could no longer fit in the 16:9 frame.
const ZOOM_SNAP = 0.25;

if (mapContainer) {
  function minZoomForWidth() {
    const exact = Math.log2(mapContainer.clientWidth / 256);
    return Math.max(2, Math.ceil(exact / ZOOM_SNAP) * ZOOM_SNAP);
  }

  const floorZoom = minZoomForWidth();

  const map = L.map(mapContainer, {
    zoomControl: false,
    gestureHandling: true,
    maxBounds: [
      [-90, -180],
      [90, 180],
    ],
    maxBoundsViscosity: 1.0,
    zoomSnap: ZOOM_SNAP,
    minZoom: floorZoom,
    center: [30, 0],
    zoom: floorZoom,
  });

  L.control.zoom({ position: "bottomright" }).addTo(map);

  const tiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    noWrap: true,
  }).addTo(map);

  const markerIcon = L.divIcon({
    className: "map-marker",
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

  function slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function createDetailList(pairs) {
    const dl = document.createElement("dl");
    for (const [term, description] of pairs) {
      const row = document.createElement("div");

      const dt = document.createElement("dt");
      dt.className = slugify(term);
      const dtLabel = document.createElement("span");
      dtLabel.textContent = term;
      dt.appendChild(dtLabel);

      const dd = document.createElement("dd");
      dd.textContent = description;

      row.append(dt, dd);
      dl.appendChild(row);
    }
    return dl;
  }

  function buildPopupContent(event) {
    const wrapper = document.createElement("div");
    wrapper.className = "event-popup";

    const title = document.createElement("h3");
    title.className = "heading";
    title.textContent = event.title;
    wrapper.appendChild(title);

    wrapper.appendChild(
      createDetailList([
        ["Starts", event.starts],
        ["Location", event.location ?? "Register for details"],
      ]),
    );

    const link = document.createElement("a");
    link.className = "button button--secondary button--has-icon button--find";
    link.href = event.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Join the event";
    wrapper.appendChild(link);

    return wrapper;
  }

  const bounds = [];
  for (const event of events) {
    if (typeof event.lat !== "number" || typeof event.lng !== "number" || Number.isNaN(event.lat) || Number.isNaN(event.lng)) {
      continue;
    }

    const marker = L.marker([event.lat, event.lng], { icon: markerIcon }).addTo(map);
    marker.bindPopup(buildPopupContent(event));
    marker.on("popupopen", () => marker.getElement()?.classList.add("is-active"));
    marker.on("popupclose", () => marker.getElement()?.classList.remove("is-active"));
    bounds.push([event.lat, event.lng]);
  }

  function fitToEvents() {
    if (bounds.length === 0) return;

    map.invalidateSize({ pan: false });
    map.fitBounds(bounds, { padding: [16, 16], animate: false, maxZoom: FIT_MAX_ZOOM });
  }

  let revealed = false;
  let revealTimer;

  function reveal() {
    if (revealed) return;
    revealed = true;
    clearTimeout(revealTimer);
    fitToEvents();
    mapContainer.classList.remove("is-loading");
  }

  revealTimer = setTimeout(reveal, 2000);
  tiles.on("load", reveal);

  new ResizeObserver(() => {
    map.setMinZoom(minZoomForWidth());

    if (revealed || bounds.length === 0) {
      map.invalidateSize();
    } else {
      fitToEvents();
    }
  }).observe(mapContainer);
}
