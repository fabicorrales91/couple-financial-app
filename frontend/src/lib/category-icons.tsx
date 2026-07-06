import {
  Home,
  Zap,
  ShoppingCart,
  Car,
  Popcorn,
  HeartPulse,
  PiggyBank,
  Users,
  Tag,
  Wallet,
  ArrowLeftRight,
  Receipt,
  type LucideIcon,
} from "lucide-react";
import type { TransactionType } from "./types";

const ICONS_BY_CATEGORY: Record<string, LucideIcon> = {
  alquiler: Home,
  servicios: Zap,
  supermercado: ShoppingCart,
  transporte: Car,
  ocio: Popcorn,
  salud: HeartPulse,
  ahorro: PiggyBank,
  "aporte hogar": Users,
  otros: Tag,
};

/**
 * Devuelve el icono adecuado para un movimiento segun su categoria (si tiene)
 * o, en su defecto, segun el tipo de movimiento (ingreso/gasto/transferencia).
 */
export function getTransactionIcon(
  categoryName: string | null | undefined,
  type: TransactionType
): LucideIcon {
  if (categoryName) {
    const match = ICONS_BY_CATEGORY[categoryName.trim().toLowerCase()];
    if (match) return match;
  }
  if (type === "ingreso") return Wallet;
  if (type === "transferencia") return ArrowLeftRight;
  return Receipt;
}
