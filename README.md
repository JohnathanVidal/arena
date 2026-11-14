# Arena – Torneos de peleas (Firebase + Cloudinary)

App web de torneos de peleas con login de Google, datos en Firestore y fotos en Cloudinary. Sin build: HTML + CSS + módulos JS.

```
index.html · css/styles.css · js/{firebase-config,auth,db,cloudinary,tournament,ui,main}.js
```
- `tournament.js`: lógica pura (llaves, play-offs, tablas, estadísticas, comparador). `ui.js`: vistas y eventos. `db.js`: Firestore. `cloudinary.js`: fotos.

## 1. Habilitar Google en Firebase (proyecto `arena-79185`)
1. Consola de Firebase → **Authentication** → pulsa **Get started** (obligatorio: sin esto Firebase responde `CONFIGURATION_NOT_FOUND`) → pestaña **Sign-in method** → **Google** → Enable → elige email de soporte → Save.
2. **Authentication → Settings → Authorized domains**: `localhost` ya viene; añade tu dominio de Hosting (`arena-79185.web.app` y `arena-79185.firebaseapp.com` suelen estar) y cualquier dominio propio.
3. **Firestore Database** → *Create database* (modo producción).

## 2. Reglas de seguridad de Firestore
Firestore → **Rules** → pega y publica. Cada usuario solo lee/escribe su propio árbol:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```
Datos: `users/{uid}/series/{id}` y `users/{uid}/trash/{id}`.

## 3. Cloudinary
Settings → Upload → *Upload presets*: `arena_unsigned` debe ser **Unsigned**. Las fotos se recortan a cuadrado, se reducen a máx. 400×400 y se suben a la carpeta `arena`; en Firestore solo se guarda la `secure_url`.

## 4. Probar en local
Los módulos ES no funcionan con doble clic (`file://`). Sirve la carpeta:
- VS Code → extensión **Live Server** → *Open with Live Server*, o
- `npx serve .` / `python -m http.server 8000` y abre `http://localhost:8000`.

## 5. Desplegar en Firebase Hosting
```
npm i -g firebase-tools
firebase login
firebase init hosting     # proyecto arena-79185 · public directory: .  · single-page app: No · no sobrescribir index.html
firebase deploy --only hosting
```
(En `firebase.json` añade `"ignore": ["README.md", "firebase.json", "**/.*"]` si no quieres publicar el README.)

## Importar peleadores desde Excel y países
- En **Peleadores** (antes de iniciar la temporada) pulsa **Importar desde Excel** (.xlsx/.xls/.csv). Columnas: `Personaje | Arte marcial / Estilo | País | Resumen breve`. Se omiten nombres repetidos y los países no reconocidos quedan sin bandera.
- Cada peleador tiene un desplegable de **País** (todos los países del mundo) que se filtra al escribir; "Desconocido" no muestra bandera. Banderas de flagsapi.com, guardadas como código ISO (`JP`, `US`…).

## Migración y copias
- Al iniciar sesión, si hay datos antiguos en `localStorage` aparece un aviso para migrarlos (solo si aceptas; las fotos en base64 se suben a Cloudinary). Después localStorage ya no se usa.
- Si los datos viven en otro dominio (p. ej. la versión anterior), usa allí **Exportar todo / Exportar serie** y aquí **Copia de seguridad → Importar datos**.
- Errores de red: aparece un aviso "Toca para reintentar" abajo a la derecha.
