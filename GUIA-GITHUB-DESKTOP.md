# Arreglar la subida con GitHub Desktop (sube TODO, con carpetas)

El problema actual: a GitHub le faltan las carpetas `assets`, `lib` y `setup`. Con GitHub Desktop se sube todo completo de una vez y queda resuelto.

---

## 1. Descargar e instalar
1. Entra a **https://desktop.github.com** y descarga **GitHub Desktop**.
2. Instálalo y ábrelo.
3. **Sign in** con la MISMA cuenta de GitHub donde creaste el repositorio.

## 2. Traer tu repositorio a la computadora (Clonar)
1. En GitHub Desktop: **File → Clone repository…**
2. En la pestaña **GitHub.com** busca y selecciona **`la-casa-del-hincha`**.
3. En **Local path** elige dónde guardarlo (por ejemplo `Documentos`). Anota esa ubicación.
4. Clic en **Clone**.

Esto crea una carpeta local vacía-ish (con los archivos que ya subiste) conectada a GitHub.

## 3. Copiar TODOS los archivos del sitio dentro de esa carpeta
1. Abre dos ventanas del Explorador de archivos:
   - **A)** Tu carpeta **`sitio-web`** (la de `Descargas/la casa del hincha tienda virtual/sitio-web`).
   - **B)** La carpeta que se creó al clonar (la de **Local path** del paso 2, se llama `la-casa-del-hincha`).
2. En la ventana **A**, entra a `sitio-web`, selecciona **TODO** (Ctrl+A): archivos y las carpetas `assets`, `lib`, `setup`.
3. **Cópialo** (Ctrl+C) y **pégalo** (Ctrl+V) dentro de la ventana **B** (la carpeta clonada).
4. Si Windows pregunta si reemplazar archivos, di **Sí / Reemplazar todo**.

## 4. Subir (commit + push)
1. Vuelve a **GitHub Desktop**. Verás en la izquierda una lista larga de archivos añadidos (incluyendo `assets/img/...`).
2. Abajo a la izquierda, en **Summary**, escribe algo como: `Subir imágenes y carpetas completas`.
3. Clic en **Commit to main**.
4. Arriba, clic en **Push origin** (sube todo a GitHub).

## 5. Verificar
- Vercel se actualiza solo en ~1 minuto.
- Abre `https://la-casa-del-hincha.vercel.app/assets/img/hero.webp` → debe verse la imagen (no error 404).
- Abre la web principal → ya deben verse todas las imágenes, y el catálogo/admin deben conectar con Supabase.

---

## De ahora en adelante (súper fácil)
Cada vez que yo te pase cambios o edites archivos:
1. Copia los archivos cambiados dentro de la carpeta clonada (reemplazando).
2. GitHub Desktop → **Commit to main** → **Push origin**.
3. Vercel republica solo.

Ya no tendrás que arrastrar nada en la web ni se perderán carpetas.
