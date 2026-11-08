(() => {
  document.documentElement.classList.add("js");
  const clock = document.getElementById("menu-clock");
  if (clock) {
    const update = () => {
      clock.textContent = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date());
    };
    update();
    setInterval(update, 30000);
  }
  const path = location.pathname;
  const section = path.includes("/astuces/") || path.endsWith("/astuces.html") ? "astuces"
    : /(outils|logiciel)\.html$/.test(path) ? "outils" : "";
  document.querySelectorAll(".menubar [data-section]").forEach((link) => {
    if (link.dataset.section === section) link.classList.add("active");
  });
})();
