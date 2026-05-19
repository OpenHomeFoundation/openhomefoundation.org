import Swiper from "swiper";
import { Navigation, Pagination } from 'swiper/modules';

new Swiper(".collab-container", {
  modules: [Navigation, Pagination],
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  spaceBetween: 24,
  slidesPerView: 1.1,
  enabled: true,
  breakpoints: {
    768: {
      slidesPerView: 2.2,
    },
    992: {
      slidesPerView: 3.2,
    },
  },
});
