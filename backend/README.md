# App Financiera — backend

API de la Fase 1: autenticación, cuentas, grupos, invitaciones y transacciones. Ver la documentación completa del proyecto en `../App Financiera.md` y `../Docs Técnicos/`.

## Arrancar en local

```bash
cp .env.example .env
docker compose up -d
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

El servidor arranca en `http://localhost:3000`. Comprobación rápida: `GET /health`.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/register` | Registra usuario y crea su cuenta personal |
| POST | `/auth/login` | Devuelve un JWT |
| GET | `/accounts/me` | Cuentas accesibles para el usuario autenticado, con saldo |
| POST | `/groups` | Crea un grupo (cuenta compartida), el creador queda como admin |
| POST | `/invites` | Genera código de invitación (`type: "contact"` o `type: "group"`) |
| POST | `/invites/redeem` | Canjea un código: vincula contacto o une a un grupo |
| POST | `/invites/:id/revoke` | Revoca una invitación propia |
| POST | `/transactions` | Registra gasto, ingreso o transferencia |
| GET | `/transactions?accountId=` | Lista movimientos de una cuenta accesible |

Todas las rutas salvo `/auth/*` y `/health` requieren `Authorization: Bearer <token>`.
