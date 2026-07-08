-- AlterTable: moneda por cuenta (ISO 4217, 3 letras). Las cuentas existentes
-- quedan en EUR por defecto, que es el comportamiento actual sin romper nada.
ALTER TABLE "accounts" ADD COLUMN "currency" VARCHAR(3) NOT NULL DEFAULT 'EUR';

-- AlterTable: marca de remesa en movimientos (envio/recepcion de dinero entre
-- paises o monedas, no necesariamente una transferencia interna entre cuentas
-- propias). Los movimientos existentes quedan en false.
ALTER TABLE "transactions" ADD COLUMN "is_remesa" BOOLEAN NOT NULL DEFAULT false;
