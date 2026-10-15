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
  });

  tiles.on("tileloadstart", ({ tile }) => {
    const size = tiles.getTileSize();
    tile.style.width = `${size.x + 1}px`;
    tile.style.height = `${size.y + 1}px`;
  });

  tiles.addTo(map);

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

    const liveBadge = document.createElement("p");
    liveBadge.className = "live-badge";
    liveBadge.textContent = "Live now";
    wrapper.appendChild(liveBadge);

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

  // ?simulate-live replays the whole Community Day timeline once in 60 seconds
  // (?simulate-live=120 for two minutes).
  const params = new URLSearchParams(window.location.search);
  const replaySeconds = params.has("simulate-live") ? Number(params.get("simulate-live")) || 60 : 0;

  const liveMarkers = [];

  for (const event of events) {
    if (typeof event.lat !== "number" || typeof event.lng !== "number" || Number.isNaN(event.lat) || Number.isNaN(event.lng)) {
      continue;
    }

    const marker = L.marker([event.lat, event.lng], { icon: markerIcon }).addTo(map);
    const popupContent = buildPopupContent(event);
    marker.bindPopup(popupContent);
    marker.on("popupopen", () => marker.getElement()?.classList.add("is-active"));
    marker.on("popupclose", () => marker.getElement()?.classList.remove("is-active"));

    liveMarkers.push({
      marker,
      popupContent,
      start: Date.parse(event.startsAt),
      end: Date.parse(event.endsAt),
      state: "upcoming",
    });
  }

  const isReplay = replaySeconds > 0 && liveMarkers.length > 0;
  const timelineStart = Math.min(...liveMarkers.map(({ start }) => start));
  const timelineEnd = Math.max(...liveMarkers.map(({ end }) => end));
  const replayStartedAt = Date.now();

  const replayClockFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  let replayClock;
  if (isReplay) {
    const clockControl = L.control({ position: "topleft" });
    clockControl.onAdd = () => {
      replayClock = L.DomUtil.create("div", "simulated-clock");
      return replayClock;
    };
    clockControl.addTo(map);
  }

  function currentTime() {
    if (!isReplay) return Date.now();
    const progress = Math.min(1, (Date.now() - replayStartedAt) / (replaySeconds * 1000));
    return timelineStart + progress * (timelineEnd - timelineStart);
  }

  function updateLiveMarkers() {
    const now = currentTime();
    if (replayClock) replayClock.textContent = `Simulated: ${replayClockFormatter.format(now)}`;

    for (const entry of liveMarkers) {
      const state = now >= entry.end ? "ended" : now >= entry.start ? "live" : "upcoming";
      if (state === entry.state) continue;
      entry.state = state;

      const markerElement = entry.marker.getElement();
      markerElement?.classList.toggle("is-live", state === "live");
      markerElement?.classList.toggle("is-ended", state === "ended");
      entry.popupContent.classList.toggle("is-live", state === "live");
    }

    if (isReplay && now >= timelineEnd) clearInterval(liveTimer);
  }

  const liveTimer = setInterval(updateLiveMarkers, isReplay ? 100 : 30_000);
  updateLiveMarkers();
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) updateLiveMarkers();
  });

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
