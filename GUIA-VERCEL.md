# Subir la tienda a Vercel con GitHub — paso a paso

Objetivo: poner la web online (gratis) para que tu cliente la vea. Más adelante le conectas un dominio pagado; el panel de admin seguirá funcionando en la dirección de Vercel.

**Idea general:** subes los archivos a **GitHub** (una especie de "nube de archivos para webs") y luego conectas **Vercel** a ese GitHub. Desde ahí, cada vez que actualices los archivos, la web se actualiza sola.

> Importante: la carpeta que vas a subir es **`sitio-web`**, y debes subir **lo que está DENTRO** de ella (que `index.html` quede en la raíz), no la carpeta en sí.

---

## PARTE 1 — Crear la cuenta de GitHub y subir los archivos

### 1.1 Crear cuenta
1. Entra a **https://github.com** y crea una cuenta gratis (botón **Sign up**). Verifica tu correo.

### 1.2 Crear el repositorio (la "carpeta" online)
1. Arriba a la derecha, clic en el **+** → **New repository**.
2. **Repository name:** `la-casa-del-hincha` (o el nombre que quieras).
3. Déjalo en **Public** (o Private, da igual para esto).
4. **No** marques "Add a README".
5. Clic en **Create repository**.

### 1.3 Subir los archivos
1. En la página del repositorio recién creado, busca el enlace **"uploading an existing file"** (o ve a **Add file → Upload files**).
2. Abre en tu computadora la carpeta **`sitio-web`**.
3. Selecciona **TODO lo que hay dentro** (Ctrl+A): `index.html`, `catalogo.html`, `admin.html`, `styles.css`, `shop.css`, `admin.css`, `main.js`, `shop.js`, `admin.js`, y las carpetas `assets`, `lib`, `setup`.
4. **Arrástralo** a la ventana de GitHub (soporta carpetas con subcarpetas). Espera a que suban todos (las imágenes pueden tardar un poco).
5. Abajo, en **Commit changes**, clic en **Commit changes**.

> Consejo: si arrastrar no te toma las subcarpetas, sube primero los archivos sueltos y luego repite "Add file → Upload files" arrastrando cada carpeta (`assets`, `lib`, `setup`). El resultado final debe tener `index.html` en la raíz del repositorio.

---

## PARTE 2 — Conectar Vercel y publicar

### 2.1 Crear cuenta en Vercel
1. Entra a **https://vercel.com** → **Sign Up** → elige **Continue with GitHub** (así quedan conectados de una vez) y autoriza.

### 2.2 Importar el proyecto
1. En Vercel, clic en **Add New… → Project**.
2. Aparece la lista de tus repositorios de GitHub. Busca **`la-casa-del-hincha`** y clic en **Import**.
3. En la pantalla de configuración:
   - **Framework Preset:** selecciona **Other** (es un sitio estático, sin configuración especial).
   - **Root Directory:** déjalo en `.` (la raíz). *Solo* si subiste la carpeta `sitio-web` completa por error, aquí eliges `sitio-web`.
   - Build/Output: **no toques nada**.
4. Clic en **Deploy** y espera ~1 minuto.

### 2.3 ¡Listo, está online!
- Vercel te da una dirección tipo **`https://la-casa-del-hincha.vercel.app`**.
- La tienda: `https://la-casa-del-hincha.vercel.app`
- El catálogo: `.../catalogo.html`
- El panel de admin: **`https://la-casa-del-hincha.vercel.app/admin.html`**

Comparte la dirección principal con tu cliente para que la vea. Para administrar, entra a `/admin.html`.

---

## PARTE 3 — Verificar que todo funcione

Abre la web publicada (no el archivo local) y comprueba:
- Entras a `/admin.html`, inicias sesión y **agregas un producto** con foto → debe aparecer en el catálogo.
- Haces una compra de prueba → llega al panel en **Pedidos** y se abre WhatsApp con el mensaje limpio.
- El QR de pago aparece en el checkout.

Todo esto ya funciona sin configurar nada extra, porque las claves de Supabase están en `lib/supabase-config.js` (la clave *publishable* es segura de tener online).

---

## PARTE 4 — Actualizar la web más adelante (muy fácil)

Cuando cambies algo de los archivos:
1. Ve a tu repositorio en GitHub → **Add file → Upload files** → arrastra los archivos cambiados (reemplaza los existentes) → **Commit changes**.
2. Vercel detecta el cambio y **vuelve a publicar solo**, en ~1 minuto. No haces nada más.

*(Opcional, para el futuro: instalar **GitHub Desktop** hace estas actualizaciones aún más cómodas arrastrando la carpeta y dando "Push".)*

---

## PARTE 5 — Dominio pagado más adelante

Cuando quieras conectar el dominio del cliente:
1. En Vercel, abre tu proyecto → pestaña **Domains** → **Add** → escribe el dominio (ej. `lacasadelhincha.com`).
2. Vercel te muestra unos registros **DNS** para pegar donde compraste el dominio. Los pegas y en minutos/horas queda activo.
3. La web principal quedará en el dominio nuevo. **El panel de admin sigue funcionando** tanto en el dominio nuevo como en la dirección `.vercel.app`; puedes seguir usando la de Vercel para administrar (`tuproyecto.vercel.app/admin.html`).

---

## Notas de seguridad
- El panel `admin.html` ya está marcado para **no aparecer en Google** (etiqueta `noindex`) y **solo funciona con tu correo y contraseña** de Supabase.
- Cualquiera que abra `/admin.html` sin iniciar sesión **no puede** ver pedidos ni modificar nada: la base de datos lo bloquea.
- Guarda bien tu correo y contraseña de admin.
