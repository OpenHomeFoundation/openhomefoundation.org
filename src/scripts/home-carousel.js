import Swiper from "swiper";
import { Autoplay } from "swiper/modules";

Swiper.use([Autoplay]);

new Swiper(".projects", {
  spaceBetween: 24,
  centeredSlides: true,
  slidesPerView: "auto",
  enabled: true,
  loop: true,
  autoplay: {
    delay: 0,
    disableOnInteraction: true,
  },
  speed: 12000,
});
