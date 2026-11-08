# Dejar lista la parte privada (Firebase)

El buzón, la pregunta del día, el botón “pienso en ti” y los sueños compartidos
usan Firebase (proyecto `nadiapp-b44ae`). Son solo para ustedes dos.

La configuración que está en `assets/js/nube.js` es pública a propósito (así
funciona Firebase en una página web). Lo que protege todo son **las reglas** de
`firestore.rules` y que solo existen **dos cuentas**. Los correos reales nunca
se escriben en este repositorio.

## Pasos (una sola vez, en https://console.firebase.google.com)

1. Entra al proyecto **nadiapp-b44ae**.
2. **Build → Firestore Database → Create database**. Elige modo producción y una
   región cercana (por ejemplo `us-central` o `nam5`).
3. **Build → Authentication → Get started → Sign-in method** y activa
   **Correo electrónico/Contraseña** (solo la primera opción, sin enlace mágico).
4. **Authentication → Users → Add user**: crea **dos** usuarios, uno con el correo
   de Luis y otro con el de Nadia, cada uno con su contraseña. Usa minúsculas.
5. **Firestore Database → Rules**: pega el contenido de `firestore.rules`,
   cambia `EMAIL_DE_LUIS` y `EMAIL_DE_NADIA` por esos dos correos (minúsculas) y
   da **Publish**.
6. **Authentication → Settings → Authorized domains**: confirma que está
   `blqa.github.io` (si usan otro dominio, agrégalo).
7. Abre el buzón en la página, entra con tu correo, elige si eres Nadia o Luis
   (solo te lo pregunta la primera vez) y listo.

No crees una cuenta más: las reglas solo dejan pasar esos dos correos.
