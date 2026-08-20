const button = document.querySelector("#navbar-menu-button");
const menu = document.querySelector("#navbar-menu");

button.addEventListener("click", (e) => {
  const isOpen = button.getAttribute("aria-expanded") === "true";
  setMenuOpen(!isOpen);
});

const setMenuOpen = (open) => {
  button.setAttribute("aria-expanded", open);
  menu.classList.toggle("expanded", open);
};

const closeMenu = () => {
  setMenuOpen(false);
};

menu.addEventListener("keyup", (e) => {
  if (e.code === "Escape") {
    closeMenu();
  }
});

document.addEventListener("click", (e) => {
  const isClickInsideElement =
    menu.contains(e.target) || button.contains(e.target);
  if (!isClickInsideElement) {
    closeMenu();
  }
});

document.querySelector('.navbar .logo').addEventListener('contextmenu', function(ev) {
  ev.preventDefault();
  document.location.assign("https://drive.google.com/drive/folders/1sCsrGh5bXnNKZETiayciW6QckzLtsR94")
});
