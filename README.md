# App Financiera

PWA de finanzas para pareja/familia. Monorepo con dos servicios independientes.

## Estructura

- `frontend/` — React 18 + TypeScript + Vite + Tailwind. PWA instalable.
- `backend/` — Node.js + Express + Prisma + PostgreSQL.

## Desarrollo local

Backend:

```
cd backend
cp .env.example .env
docker compose up -d
npm install
npm run prisma:migrate
npm run dev
```

Frontend:

```
cd frontend
npm install
npm run dev
```

## Despliegue en Railway

Dos servicios en el mismo proyecto de Railway, cada uno con "Root Directory" apuntando a `backend/` y `frontend/` respectivamente. Ver detalles de variables de entorno y comandos de build/start en la documentación del proyecto (Obsidian: App Financiera).
