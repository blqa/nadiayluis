/* =========================================================
   Cosas que comparten todas las páginas:
   el menú, el pie de página y los cálculos de fechas.
   Para agregar una sección al menú, agrégala en SECCIONES.
   ========================================================= */

const SECCIONES = [
  { archivo: "index.html", nombre: "Inicio" },
  { archivo: "historia.html", nombre: "Historia" },
  { archivo: "cartas.html", nombre: "Cartas" },
  { archivo: "biblioteca.html", nombre: "Biblioteca" },
  { archivo: "razones.html", nombre: "Razones" },
  { archivo: "canciones.html", nombre: "Canciones" },
  { archivo: "suenos.html", nombre: "Sueños" },
  { archivo: "numeros.html", nombre: "Números" },
];

(function ponerMenu() {
  const actual = location.pathname.split("/").pop() || "index.html";
  const enlaces = SECCIONES.map(s =>
    `<li><a href="${s.archivo}"${s.archivo === actual ? ' aria-current="page"' : ""}>${s.nombre}</a></li>`
  ).join("");

  const menu = document.createElement("nav");
  menu.className = "menu";
  menu.setAttribute("aria-label", "Secciones");
  menu.innerHTML = `
    <div class="contenedor">
      <a class="menu-logo" href="index.html">N <span>&amp;</span> L</a>
      <div class="menu-der">
        <ul class="menu-enlaces" id="menu-lista">${enlaces}</ul>
        <button class="tema" type="button" aria-label="Cambiar a modo oscuro">
          <svg class="luna" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"/></svg>
          <svg class="sol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
        </button>
        <button class="menu-boton" aria-expanded="false" aria-controls="menu-lista" aria-label="Abrir menú">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>
        </button>
      </div>
    </div>`;
  document.body.prepend(menu);

  const boton = menu.querySelector(".menu-boton");
  boton.addEventListener("click", () => {
    const abierto = menu.classList.toggle("abierto");
    boton.setAttribute("aria-expanded", abierto);
    boton.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
  });

  /* Modo oscuro: sigue al sistema hasta que se elige uno con el botón */
  const raiz = document.documentElement;
  const oscuroSistema = matchMedia("(prefers-color-scheme: dark)");
  const botonTema = menu.querySelector(".tema");
  const esOscuro = () => raiz.dataset.theme ? raiz.dataset.theme === "dark" : oscuroSistema.matches;
  function pintarTema() {
    raiz.dataset.modo = esOscuro() ? "oscuro" : "claro";
    botonTema.setAttribute("aria-label", esOscuro() ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
  }
  botonTema.addEventListener("click", () => {
    const nuevo = esOscuro() ? "light" : "dark";
    raiz.dataset.theme = nuevo;
    try { localStorage.setItem("nyl-tema", nuevo); } catch (e) {}
    pintarTema();
  });
  oscuroSistema.addEventListener("change", pintarTema);
  pintarTema();

  const pie = document.createElement("footer");
  pie.className = "pie";
  pie.innerHTML = `
    <div class="contenedor">
      <span>Para <em>Nadia</em>, de Luis.</span>
      <a href="secreto.html">Desde el 11 de junio de 2025</a>
      <small class="firma-gp">NadiayLuis by <a href="https://godsplan.site" rel="noopener">GodsPlan</a></small>
    </div>`;
  document.body.append(pie);
})();

/* ---------- Fechas ---------- */
const DIA = 1000 * 60 * 60 * 24;
const fecha = s => new Date(s);
const diasEntre = (a, b) => Math.floor((b - a) / DIA);
const formato = n => n.toLocaleString("es-MX");

const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

/* Los días de la pausa (entre que nos separamos y volvimos a ser novios) */
function diasPausa() {
  const f = window.DATOS.fechas;
  return Math.round((fecha(f.regreso) - fecha(f.pausa)) / DIA);
}

/* Nuestro inicio "recalculado": el 11 de junio de 2025 recorrido los días
   de la pausa. Desde aquí se cuentan los meses y el aniversario. */
function inicioSinPausa() {
  const i = fecha(window.DATOS.fechas.inicio);
  return new Date(i.getFullYear(), i.getMonth(), i.getDate() + diasPausa(), i.getHours(), i.getMinutes());
}

/* Días juntos: capítulo uno + capítulo dos (la pausa no cuenta) */
function tiempoJuntos(ahora = new Date()) {
  const f = window.DATOS.fechas;
  const uno = diasEntre(fecha(f.inicio), fecha(f.pausa));
  const dos = Math.max(0, diasEntre(fecha(f.regreso), ahora));
  return { uno, dos, total: uno + dos, pausa: diasPausa() };
}

/* Un día del mes que no se pase (ej. 31 en febrero → 28) */
function diaDelMes(ano, mes, dia) {
  return new Date(ano, mes, Math.min(dia, new Date(ano, mes + 1, 0).getDate()));
}

/* El próximo mesiversario, contando desde el inicio sin la pausa */
function proximoMesiversario(ahora = new Date()) {
  const inicio = inicioSinPausa();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  let siguiente = diaDelMes(hoy.getFullYear(), hoy.getMonth(), inicio.getDate());
  if (siguiente < hoy) siguiente = diaDelMes(hoy.getFullYear(), hoy.getMonth() + 1, inicio.getDate());
  const meses = (siguiente.getFullYear() - inicio.getFullYear()) * 12 + (siguiente.getMonth() - inicio.getMonth());
  const faltan = Math.round((siguiente - hoy) / DIA);
  return { fecha: siguiente, meses, faltan };
}

/* Para escribir texto sin que rompa el HTML */
function limpio(texto) {
  const d = document.createElement("div");
  d.textContent = texto;
  return d.innerHTML.replace(/"/g, "&quot;");
}
