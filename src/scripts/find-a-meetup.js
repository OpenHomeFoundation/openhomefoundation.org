import L from "leaflet";

window.L = L;
await import("leaflet-gesture-handling");

const mapContainer = document.getElementById("find-a-meetup-map");
const eventsDataEl = document.getElementById("find-a-meetup-events");
const events = eventsDataEl ? JSON.parse(eventsDataEl.textContent) : [];

if (mapContainer) {
  function minZoomForWidth() {
    return Math.max(2, Math.ceil(Math.log2(mapContainer.clientWidth / 256)));
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
    map.fitBounds(bounds, { padding: [16, 16], animate: false });

    if (window.matchMedia("(min-width: 1024px)").matches) {
      map.panBy([-90, -70], { animate: false });
      map.setZoom(map.getZoom() + 0.5, { animate: false });
    }
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
