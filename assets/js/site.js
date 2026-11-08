/* =========================================================
   Cosas que comparten todas las páginas:
   el menú, el pie de página y los cálculos de fechas.
   Para agregar una sección al menú, agrégala en SECCIONES.
   ========================================================= */

const SECCIONES = [
  { archivo: "index.html", nombre: "Inicio" },
  { archivo: "historia.html", nombre: "Nuestra historia" },
  { archivo: "cartas.html", nombre: "Cartas" },
  { archivo: "canciones.html", nombre: "Canciones" },
  { archivo: "suenos.html", nombre: "Sueños" },
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
      <button class="menu-boton" aria-expanded="false" aria-controls="menu-lista" aria-label="Abrir menú">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>
      </button>
      <ul class="menu-enlaces" id="menu-lista">${enlaces}</ul>
    </div>`;
  document.body.prepend(menu);

  const boton = menu.querySelector(".menu-boton");
  boton.addEventListener("click", () => {
    const abierto = menu.classList.toggle("abierto");
    boton.setAttribute("aria-expanded", abierto);
    boton.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
  });

  const pie = document.createElement("footer");
  pie.className = "pie";
  pie.innerHTML = `
    <div class="contenedor">
      <span>Para <em>Nadia</em>, de Luis.</span>
      <a href="secreto.html">Desde el 11 de junio de 2025</a>
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
