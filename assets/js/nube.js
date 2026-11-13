/* =========================================================
   La nube (Firebase): lo que es solo para los dos.

   - Entrar con correo y contraseña (solo existen 2 cuentas).
   - Buzón, pregunta del día, “pienso en ti” y sueños compartidos.

   OJO: esta configuración es pública a propósito (así funciona Firebase
   en una página web). Lo que protege lo privado son las REGLAS de
   Firestore (archivo firestore.rules): solo dejan pasar tus 2 correos.
   Mira LEEME-FIREBASE.md para dejarlo listo.
   ========================================================= */
(function () {
  const CONFIG = {
    apiKey: "AIzaSyBqXPV9LA3j1MY6swbM-d4YqsuxGT37Q7g",
    authDomain: "nadiapp-b44ae.firebaseapp.com",
    projectId: "nadiapp-b44ae",
    storageBucket: "nadiapp-b44ae.firebasestorage.app",
    messagingSenderId: "458286198231",
    appId: "1:458286198231:web:d9801e0dd6ea4fd0ae2f92",
  };
  const VERSION = "10.14.1";
  const BASE = "https://www.gstatic.com/firebasejs/" + VERSION + "/";
  const LLAVE_SESION = "nyl-nube";

  let promesa = null;
  function iniciar() {
    if (promesa) return promesa;
    promesa = Promise.all([
      import(BASE + "firebase-app.js"),
      import(BASE + "firebase-auth.js"),
      import(BASE + "firebase-firestore.js"),
    ]).then(([app, auth, fs]) => {
      const a = app.initializeApp(CONFIG);
      return { app: a, auth: auth.getAuth(a), db: fs.getFirestore(a), A: auth, F: fs };
    });
    promesa.catch(() => { promesa = null; });
    return promesa;
  }

  /* ---------- Cosas chiquitas que usan las páginas ---------- */
  const dos = n => String(n).padStart(2, "0");

  /* “2026-11-08”, en la hora de tu teléfono */
  function hoyId(d = new Date()) {
    return d.getFullYear() + "-" + dos(d.getMonth() + 1) + "-" + dos(d.getDate());
  }

  function cuando(fecha) {
    if (!fecha) return "ahora";
    const d = fecha.toDate ? fecha.toDate() : new Date(fecha);
    const seg = (Date.now() - d) / 1000;
    if (seg < 60) return "ahora";
    if (seg < 3600) return "hace " + Math.round(seg / 60) + " min";
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const hora = dos(d.getHours()) + ":" + dos(d.getMinutes());
    if (d >= hoy) return "hoy " + hora;
    const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1);
    if (d >= ayer) return "ayer " + hora;
    return d.getDate() + " de " + MESES[d.getMonth()] + (d.getFullYear() !== hoy.getFullYear() ? " de " + d.getFullYear() : "");
  }

  let toastEl = null, toastTimer = 0;
  function toast(texto) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      document.body.append(toastEl);
    }
    toastEl.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.7 5 6 5c2.1 0 3.6 1.2 4.5 2.6h3C14.4 6.2 15.9 5 18 5c3.3 0 5.1 3.4 3.6 6.8C19.5 16.4 12 21 12 21Z"/></svg><span></span>';
    toastEl.querySelector("span").textContent = texto;
    requestAnimationFrame(() => toastEl.classList.add("visible"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("visible"), 5200);
  }

  function mensaje(e) {
    const c = (e && (e.code || e.message)) || "";
    if (/invalid-credential|wrong-password|user-not-found|invalid-login/.test(c)) return "Correo o contraseña incorrectos.";
    if (/invalid-email/.test(c)) return "Ese correo no se ve bien.";
    if (/too-many-requests/.test(c)) return "Muchos intentos. Espera un momento y vuelve a intentar.";
    if (/network/.test(c)) return "Sin conexión. Revisa tu internet.";
    if (/operation-not-allowed/.test(c)) return "Falta activar “Correo/Contraseña” en Firebase.";
    if (/permission-denied|insufficient/.test(c)) return "Esta cuenta no tiene permiso. Revisa las reglas de Firestore.";
    return "Algo salió mal (" + c + ").";
  }

  /* ---------- El cuadro para entrar ---------- */
  async function acceso(cont, opciones = {}) {
    const { alListo, alSalir, titulo = "Esto es solo para los dos", texto = "Entra con tu correo y tu contraseña." } = opciones;
    const pintar = html => { cont.innerHTML = html; };

    pintar('<p class="nota">Conectando…</p>');
    let N;
    try { N = await iniciar(); }
    catch (e) {
      pintar('<div class="acceso"><h2>No pude conectar</h2><p>Revisa tu internet y vuelve a abrir esta página.</p></div>');
      return;
    }
    const { auth, db, A, F } = N;

    function pintarLogin(error = "") {
      pintar(`<div class="acceso">
        <h2>${limpio(titulo)}</h2>
        <p>${limpio(texto)}</p>
        <form id="acc-form">
          <label>Correo<input type="email" name="correo" autocomplete="username" required></label>
          <label>Contraseña<input type="password" name="clave" autocomplete="current-password" required></label>
          <p class="error" id="acc-error" role="alert">${limpio(error)}</p>
          <button class="boton" type="submit">Entrar</button>
        </form></div>`);
      const form = cont.querySelector("#acc-form");
      form.addEventListener("submit", async e => {
        e.preventDefault();
        const boton = form.querySelector("button");
        boton.disabled = true; boton.textContent = "Entrando…";
        try {
          await A.signInWithEmailAndPassword(auth, form.correo.value.trim(), form.clave.value);
        } catch (err) {
          cont.querySelector("#acc-error").textContent = mensaje(err);
          boton.disabled = false; boton.textContent = "Entrar";
        }
      });
    }

    function pintarProblema(error) {
      pintar(`<div class="acceso"><h2>Casi</h2><p>${limpio(error)}</p><button class="boton claro" id="acc-salir" type="button">Salir</button></div>`);
      cont.querySelector("#acc-salir").addEventListener("click", () => A.signOut(auth));
    }

    function preguntarQuien(user) {
      return new Promise(listo => {
        pintar(`<div class="acceso"><h2>¿Quién eres?</h2><p>Solo te lo pregunto esta vez.</p>
          <div class="quien"><button class="boton claro" type="button" data-n="Nadia">Nadia</button><button class="boton claro" type="button" data-n="Luis">Luis</button></div>
          <p class="error" id="acc-error" role="alert"></p></div>`);
        cont.querySelectorAll("[data-n]").forEach(b => b.addEventListener("click", async () => {
          b.disabled = true;
          try {
            await F.setDoc(F.doc(db, "usuarios", user.uid), { nombre: b.dataset.n, creado: F.serverTimestamp() });
            listo(b.dataset.n);
          } catch (err) {
            cont.querySelector("#acc-error").textContent = mensaje(err);
            b.disabled = false;
          }
        }));
      });
    }

    A.onAuthStateChanged(auth, async user => {
      Nube.yo = null;
      if (!user) {
        try { localStorage.removeItem(LLAVE_SESION); } catch (e) {}
        if (alSalir) alSalir();
        pintarLogin();
        return;
      }
      let nombre;
      try {
        const ref = F.doc(db, "usuarios", user.uid);
        const snap = await F.getDoc(ref);
        nombre = snap.exists() ? snap.data().nombre : await preguntarQuien(user);
      } catch (err) {
        pintarProblema(mensaje(err));
        return;
      }

      Nube.yo = { uid: user.uid, nombre, email: user.email };
      try { localStorage.setItem(LLAVE_SESION, "1"); } catch (e) {}
      pintar(`<p class="sesion">Hola, <strong>${limpio(nombre)}</strong>
        <button type="button" id="acc-salir">Salir</button>
        <button type="button" id="acc-cambiar" style="opacity:.7">No soy ${limpio(nombre)}</button></p>`);
      cont.querySelector("#acc-salir").addEventListener("click", () => A.signOut(auth));
      cont.querySelector("#acc-cambiar").addEventListener("click", async () => {
        try { await F.deleteDoc(F.doc(db, "usuarios", user.uid)); } catch (e) {}
        location.reload();
      });
      if (alListo) alListo(Nube.yo, N);
    });
  }

  const Nube = window.Nube = {
    iniciar, acceso, hoyId, cuando, toast, mensaje,
    yo: null,
    sesionGuardada() { try { return localStorage.getItem(LLAVE_SESION) === "1"; } catch (e) { return false; } },
    get otroNombre() { return this.yo ? (this.yo.nombre === "Luis" ? "Nadia" : "Luis") : ""; },
  };
})();
