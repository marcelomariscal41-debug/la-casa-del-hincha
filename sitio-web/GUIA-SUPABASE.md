# Guía para activar el catálogo administrable — La Casa del Hincha

Con estos pasos la tienda podrá **agregar productos, subir fotos, ver pedidos y recibir reseñas** por su cuenta, desde cualquier dispositivo, sin depender de nadie. Todo es **gratis** en el nivel inicial de Supabase.

Solo se hace **una vez**. Toma ~15 minutos.

---

## 1. Crear la cuenta y el proyecto

1. Entra a **https://supabase.com** y crea una cuenta (puedes usar tu Google).
2. Clic en **New project**.
3. Ponle un nombre (ej. `la-casa-del-hincha`), crea una **Database Password** (guárdala) y elige la región más cercana (ej. *South America (São Paulo)*).
4. Clic en **Create new project** y espera ~2 minutos a que se prepare.

## 2. Crear las tablas (base de datos)

1. En el menú izquierdo abre **SQL Editor** → **New query**.
2. Abre el archivo **`setup/supabase-setup.sql`** (está en esta misma carpeta), copia **todo** su contenido y pégalo.
3. Clic en **Run**. Debe decir *Success*.

## 3. Crear los "almacenes" de imágenes (Storage)

1. En el menú izquierdo abre **Storage**.
2. Clic en **New bucket** → nombre exacto: **`productos`** → activa **Public bucket** → **Save**.
3. Repite y crea otro bucket llamado exacto: **`resenas`** → también **Public** → **Save**.

## 4. Crear el usuario administrador (tu login)

1. En el menú izquierdo abre **Authentication** → **Users** → **Add user** → **Create new user**.
2. Escribe el **correo** y la **contraseña** con la que la tienda entrará al panel.
3. Marca **Auto Confirm User** (para que no pida confirmar por email) → **Create user**.

> Esta será la contraseña del panel de admin. Puedes crear más usuarios si varias personas administran.

## 5. Copiar tus claves en la tienda

1. En Supabase abre **Project Settings** (engranaje) → **API**.
2. Copia el **Project URL** y la clave **anon public**.
3. Abre el archivo **`lib/supabase-config.js`** de esta carpeta y pégalos:

```js
SUPABASE_URL:      "https://TUPROYECTO.supabase.co",
SUPABASE_ANON_KEY: "eyJ....(tu clave anon public)....",
```

Guarda el archivo. **¡Listo!** La tienda ya está conectada.

## 6. Cargar tu primer producto y el QR de pago

1. Abre **`admin.html`** (en tu web publicada sería `tudominio.com/admin.html`).
2. Entra con el correo y contraseña del paso 4.
3. En **Agregar producto**: nombre, categorías, tallas, precio, fotos (hasta 3), promoción y si permite nombre/número.
4. En **Pago (QR)**: sube la imagen de tu QR de cobro y guarda.
5. En **Pedidos** verás todas las compras con nombre, talla, personalización y total.

---

## Seguridad (importante)

- El panel `admin.html` **solo funciona con tu correo y contraseña**. Aunque alguien abra la dirección, no puede agregar ni borrar nada sin iniciar sesión: la base de datos rechaza cualquier cambio sin login válido.
- La clave `anon public` es **segura de poner en la web**: está pensada para eso y solo permite lo que las reglas autorizan (ver productos, crear pedidos y reseñas).
- Nunca compartas la contraseña de la base de datos (paso 1) ni la clave `service_role`.

## Publicar los cambios

Cada vez que edites archivos y los subas a Vercel/Hostinger, la web se actualiza. Los **productos e imágenes NO** se suben a Vercel: viven en Supabase, así que la tienda los gestiona sola desde `admin.html` sin tocar el código.
