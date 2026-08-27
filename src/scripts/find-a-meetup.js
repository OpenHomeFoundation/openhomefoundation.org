import L from "leaflet";
import Swiper from "swiper";
import { Pagination } from "swiper/modules";

window.L = L;
await import("leaflet-gesture-handling");

const mapContainer = document.getElementById("find-a-meetup-map");
const cards = Array.from(document.querySelectorAll(".event-card"));

if (mapContainer && cards.length > 0) {
  const map = L.map(mapContainer, {
    zoomControl: true,
    gestureHandling: true,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  const markerIcon = L.divIcon({
    className: "map-marker",
    iconSize: [8, 8],
    iconAnchor: [4, 4],
  });

  const markersByEventId = new Map();
  const bounds = [];
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setActive(eventId, isActive) {
    const entry = markersByEventId.get(eventId);
    if (!entry) return;

    entry.card.classList.toggle("is-active", isActive);
    entry.marker.getElement()?.classList.toggle("is-active", isActive);
  }

  function panToIfNeeded(eventId) {
    const entry = markersByEventId.get(eventId);
    if (!entry) return;

    const latlng = entry.marker.getLatLng();
    if (!map.getBounds().contains(latlng)) {
      map.panTo(latlng, { animate: !prefersReducedMotion, duration: 0.375 });
    }
  }

  cards.forEach((card) => {
    const lat = parseFloat(card.dataset.lat);
    const lng = parseFloat(card.dataset.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    const eventId = card.dataset.eventId;
    const link = card.querySelector(".event-card-link");
    const marker = L.marker([lat, lng], { icon: markerIcon });
    bounds.push([lat, lng]);

    marker.on("mouseover", () => setActive(eventId, true));
    marker.on("mouseout", () => setActive(eventId, false));
    card.addEventListener("mouseenter", () => {
      setActive(eventId, true);
      panToIfNeeded(eventId);
    });
    card.addEventListener("mouseleave", () => setActive(eventId, false));

    if (link) {
      marker.on("click", () => window.open(link.href, "_blank", "noopener,noreferrer"));
    }

    markersByEventId.set(eventId, { marker, card });
  });

  if (bounds.length > 0) {
    map.invalidateSize();
    map.fitBounds(bounds, { padding: [16, 16] });
  }

  function showEventsForSlide(slideEl) {
    const visibleIds = new Set(Array.from(slideEl.querySelectorAll(".event-card")).map((card) => card.dataset.eventId));

    markersByEventId.forEach(({ marker }, eventId) => {
      const shouldShow = visibleIds.has(eventId);
      const isShown = map.hasLayer(marker);
      if (shouldShow && !isShown) marker.addTo(map);
      if (!shouldShow && isShown) map.removeLayer(marker);
    });
  }

  new Swiper(".events-swiper", {
    modules: [Pagination],
    slidesPerView: 1,
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    on: {
      init(swiper) {
        showEventsForSlide(swiper.slides[swiper.activeIndex]);
        requestAnimationFrame(() => map.invalidateSize());
      },
      slideChange(swiper) {
        showEventsForSlide(swiper.slides[swiper.activeIndex]);
      },
    },
  });

  window.addEventListener("resize", () => map.invalidateSize());
}
