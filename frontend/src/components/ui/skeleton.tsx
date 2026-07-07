import { cn } from "../../lib/utils";

/**
 * Bloque base para estados de carga tipo "skeleton". Usa la animacion
 * "pulse" nativa de Tailwind (no requiere configuracion adicional).
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}
