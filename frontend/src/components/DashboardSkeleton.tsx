import { Skeleton } from "./ui/skeleton";
import { Card, CardContent, CardHeader } from "./ui/card";

/**
 * Version reducida del bloque de contenido de MonthlySummaryCard, para
 * reusar en su propio estado de carga (cambio de mes, refresco) sin repetir
 * el texto plano "Cargando..." que rompia la consistencia visual.
 */
export function SummaryContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-14" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Replica la forma real del dashboard (hero + resumen mensual + movimientos)
 * mientras se cargan los datos por primera vez, para que la pantalla no de
 * un salto de layout cuando el contenido real reemplaza al skeleton.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <section className="rounded-lg bg-primary p-6">
        <Skeleton className="mb-3 h-4 w-24 bg-primary-foreground/20" />
        <Skeleton className="mb-4 h-9 w-40 bg-primary-foreground/20" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-20 rounded-full bg-primary-foreground/20" />
          <Skeleton className="h-7 w-20 rounded-full bg-primary-foreground/20" />
        </div>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <Skeleton className="h-4 w-36" />
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-16 shrink-0" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
