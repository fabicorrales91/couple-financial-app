# App Financiera — frontend (PWA)

Interfaz web instalable (React 18 + TypeScript + Vite + Tailwind). Habla con el backend de `../backend`. Ver la documentación completa del proyecto en la vault de Obsidian (`Proyectos/App Financiera`).

## Arrancar en local

```bash
cp .env.example .env
npm install
npm run dev
```

Antes necesitas el backend corriendo (ver `../backend/README.md`). Por defecto apunta a `http://localhost:3000` via `VITE_API_URL`.

## Que incluye la v1

- Login y registro (crea tu cuenta personal automaticamente).
- Dashboard con tus cuentas (personal y grupos) y su saldo.
- Registrar gasto, ingreso o transferencia, con categoria.
- Historial de movimientos por cuenta.
- Crear grupos, generar codigos de invitacion (contacto o grupo), canjear codigos.
- Instalable como PWA (manifest + service worker via `vite-plugin-pwa`).

## Pendiente / conocido

- Los iconos en `public/icons/` son placeholders generados automaticamente (texto "AF" sobre fondo solido). Reemplazalos por el icono real de la app antes de publicar.
- No hay listado de invitaciones generadas (solo se muestra el ultimo codigo creado). Si hace falta historial, agregar `GET /invites/mine` en el backend.
- `src/App.css` y `src/assets/react.svg` son restos del scaffold inicial sin usar, puedes borrarlos a mano.

## Build de produccion

```bash
npm run build
npm run preview
```
