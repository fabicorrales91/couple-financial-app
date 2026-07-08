/**
 * Formato de moneda compartido. El monto se muestra siempre en la moneda de
 * la CUENTA (no hay conversion de tipo de cambio en esta version: un
 * movimiento entre cuentas de distinta moneda guarda el monto tal cual, sin
 * ajustar por FX). Ver docs de la vault, seccion multi-moneda.
 */
export function formatOptionsFor(currency: string): Intl.NumberFormatOptions {
  return { style: "currency", currency };
}

export function formatMoney(amount: string | number, currency: string, locale = "es-ES") {
  return Number(amount).toLocaleString(locale, formatOptionsFor(currency));
}

/**
 * Codigos de moneda mas relevantes para el caso de uso actual (hogar en
 * Europa + familia/ahorros en Colombia). No es una lista exhaustiva de ISO
 * 4217: es un atajo para el selector de "nueva cuenta"; cualquier otro
 * codigo de 3 letras sigue siendo valido escribiendolo a mano.
 */
export const COMMON_CURRENCIES = [
  { code: "EUR", label: "EUR — Euro" },
  { code: "COP", label: "COP — Peso colombiano" },
  { code: "USD", label: "USD — Dolar estadounidense" },
  { code: "GBP", label: "GBP — Libra esterlina" },
  { code: "MXN", label: "MXN — Peso mexicano" },
  { code: "ARS", label: "ARS — Peso argentino" },
] as const;
