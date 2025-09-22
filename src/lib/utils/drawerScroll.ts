let scrollY = 0;

export function lockBodyScroll() {
  scrollY = window.scrollY;
  document.body.classList.add("body--drawer-open");
  document.body.style.top = `-${scrollY}px`;
}

export function unlockBodyScroll() {
  document.body.classList.remove("body--drawer-open");
  document.body.style.top = "";
}
