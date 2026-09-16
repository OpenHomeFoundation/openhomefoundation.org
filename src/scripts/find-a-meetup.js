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

const CENTER_LAT = 15;

if (mapContainer) {
  const map = L.map(mapContainer, {
    zoomControl: false,
    gestureHandling: true,
    maxBounds: [
      [-90, -180],
      [90, 180],
    ],
    maxBoundsViscosity: 1.0,
    zoomSnap: 0,
    center: [CENTER_LAT, 0],
    zoom: 0,
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

  for (const event of events) {
    if (typeof event.lat !== "number" || typeof event.lng !== "number" || Number.isNaN(event.lat) || Number.isNaN(event.lng)) {
      continue;
    }

    const marker = L.marker([event.lat, event.lng], { icon: markerIcon }).addTo(map);
    marker.bindPopup(buildPopupContent(event));
    marker.on("popupopen", () => marker.getElement()?.classList.add("is-active"));
    marker.on("popupclose", () => marker.getElement()?.classList.remove("is-active"));
  }

  // Zoom at which the world covers the container's longest side.
  function worldZoom() {
    const size = Math.max(mapContainer.clientWidth, mapContainer.clientHeight);
    return Math.max(0, Math.log2(size / 256));
  }

  function showWholeWorld() {
    map.invalidateSize({ pan: false });
    const zoom = worldZoom();
    map.setMinZoom(zoom);
    map.setView([CENTER_LAT, 0], zoom, { animate: false });
  }

  showWholeWorld();

  let revealed = false;
  let revealTimer;

  function reveal() {
    if (revealed) return;
    revealed = true;
    clearTimeout(revealTimer);
    showWholeWorld();
    mapContainer.classList.remove("is-loading");
  }

  revealTimer = setTimeout(reveal, 2000);
  tiles.on("load", reveal);

  let resizeTimer;
  new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(showWholeWorld, 150);
  }).observe(mapContainer);
}
