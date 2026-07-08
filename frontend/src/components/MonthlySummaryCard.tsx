import * as React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Alert } from "./ui/alert";
import { CountUpNumber } from "./ui/rolling-number";
import { SummaryContentSkeleton } from "./DashboardSkeleton";
import { getTransactionIcon } from "../lib/category-icons";
import { formatOptionsFor } from "../lib/currency";
import { cn } from "../lib/utils";
import { api, ApiError } from "../lib/api";
import type { MonthlySummary } from "../lib/types";

// Rotacion de color por categoria (coral, verde, marron calido), igual que el mockup de referencia.
const CATEGORY_BAR_COLORS = ["bg-primary", "bg-secondary", "bg-[#a8887a]"];
const CATEGORY_ICON_TINTS = [
  "bg-primary/15 text-primary",
  "bg-secondary/15 text-secondary",
  "bg-[#a8887a]/15 text-[#a8887a]",
];

function currentMonthLabel() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(label: string, delta: number) {
  const [year, month] = label.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatMonthTitle(label: string) {
  const [year, month] = label.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  const text = date.toLocaleDateString("es-ES", { month: "long", year: "numeric", timeZone: "UTC" });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Barra de progreso de una categoria: arranca en 0% y anima hacia su ancho
 * real cada vez que se monta (cada carga/refresco de este bloque), dando el
 * efecto de "rellenando la barra" pedido para el estado de carga.
 */
function AnimatedBar({ targetPercent, colorClassName }: { targetPercent: number; colorClassName: string }) {
  const [percent, setPercent] = React.useState(0);

  React.useEffect(() => {
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setPercent(targetPercent));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [targetPercent]);

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${colorClassName}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function MonthlySummaryCard({
  accountId,
  accountCurrency,
  refreshToken,
  activeFilter,
  onSelectCategory,
}: {
  accountId: string;
  accountCurrency: string;
  refreshToken?: number;
  /** "none" | uuid de la categoria activa, o null si no hay filtro. */
  activeFilter?: string | null;
  onSelectCategory?: (categoryId: "none" | string | null, categoryName: string) => void;
}) {
  const currencyFormat = formatOptionsFor(accountCurrency);
  const [month, setMonth] = React.useState(currentMonthLabel());
  const [summary, setSummary] = React.useState<MonthlySummary | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<{ summary: MonthlySummary }>(
        `/transactions/summary?accountId=${accountId}&month=${month}`
      );
      setSummary(result.summary);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar el resumen");
    } finally {
      setLoading(false);
    }
  }, [accountId, month]);

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, refreshToken]);

  const totalGasto = Number(summary?.totalGasto ?? 0);
  const totalIngreso = Number(summary?.totalIngreso ?? 0);
  const previousTotalGasto = Number(summary?.previousMonthTotalGasto ?? 0);
  const maxCategoryTotal = summary?.byCategory.length
    ? Math.max(...summary.byCategory.map((c) => Number(c.total)))
    : 0;

  // Un gasto que sube es una mala señal (coral) y uno que baja es buena señal (verde),
  // no un simple "+"/"-" neutro: en una app financiera el color debe decir si es bueno o malo.
  let deltaPct: number | null = null;
  if (summary && previousTotalGasto > 0) {
    deltaPct = ((totalGasto - previousTotalGasto) / previousTotalGasto) * 100;
  }

  return (
    <Card className="transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Resumen del mes</CardTitle>
            <CardDescription>{summary ? formatMonthTitle(summary.month) : "..."}</CardDescription>
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => setMonth((m) => shiftMonth(m, -1))}>
              {"<"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setMonth((m) => shiftMonth(m, 1))}>
              {">"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <Alert variant="destructive">{error}</Alert>}

        {loading ? (
          <SummaryContentSkeleton />
        ) : summary ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Gastos</p>
                <p className="text-xl font-semibold text-destructive">
                  <CountUpNumber value={totalGasto} formatOptions={currencyFormat} />
                </p>
                {deltaPct !== null && (
                  <p
                    className={cn(
                      "flex items-center gap-1 text-xs font-medium",
                      deltaPct >= 0 ? "text-destructive" : "text-secondary"
                    )}
                  >
                    {deltaPct >= 0 ? (
                      <TrendingUp className="h-3 w-3" strokeWidth={2.5} />
                    ) : (
                      <TrendingDown className="h-3 w-3" strokeWidth={2.5} />
                    )}
                    {deltaPct >= 0 ? "+" : ""}
                    {deltaPct.toFixed(0)}% vs mes anterior
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ingresos</p>
                <p className="text-xl font-semibold text-secondary">
                  <CountUpNumber value={totalIngreso} formatOptions={currencyFormat} />
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Gastos por categoria</p>
              {summary.byCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin gastos registrados este mes</p>
              ) : (
                summary.byCategory.map((c, index) => {
                  const filterValue = c.categoryId ?? "none";
                  const isActive = activeFilter === filterValue;
                  const barColor = CATEGORY_BAR_COLORS[index % CATEGORY_BAR_COLORS.length];
                  const iconTint = CATEGORY_ICON_TINTS[index % CATEGORY_ICON_TINTS.length];
                  const Icon = getTransactionIcon(c.categoryName, "gasto");
                  const total = Number(c.total);
                  const targetPercent = maxCategoryTotal > 0 ? (total / maxCategoryTotal) * 100 : 0;
                  return (
                    <button
                      key={filterValue}
                      type="button"
                      onClick={() =>
                        onSelectCategory?.(
                          isActive ? null : filterValue,
                          c.categoryName
                        )
                      }
                      className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-accent ${
                        isActive ? "bg-accent" : ""
                      }`}
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                          iconTint
                        )}
                      >
                        <Icon className="h-5 w-5" strokeWidth={2} />
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="truncate">{c.categoryName}</span>
                          <span className="font-medium">
                            <CountUpNumber value={total} formatOptions={currencyFormat} />
                          </span>
                        </div>
                        <AnimatedBar targetPercent={targetPercent} colorClassName={barColor} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
