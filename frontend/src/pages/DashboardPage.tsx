import * as React from "react";
import { RefreshCw, Download } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../lib/api";
import { checkForAppUpdate } from "../lib/reload-app";
import { cn } from "../lib/utils";
import type { Account, Category, Transaction } from "../lib/types";
import { TransactionList } from "../components/TransactionList";
import { NewTransactionDialog } from "../components/NewTransactionDialog";
import { NewAccountDialog } from "../components/NewAccountDialog";
import { GroupsAndInvitesSection } from "../components/GroupsAndInvitesSection";
import { MonthlySummaryCard } from "../components/MonthlySummaryCard";
import { DashboardSkeleton } from "../components/DashboardSkeleton";
import { CountUpNumber } from "../components/ui/rolling-number";
import { Button } from "../components/ui/button";
import { Alert } from "../components/ui/alert";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { formatOptionsFor, formatMoney } from "../lib/currency";

export function DashboardPage() {
  const { logout } = useAuth();
  const [reloading, setReloading] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [selectedAccountId, setSelectedAccountId] = React.useState<string | null>(null);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [summaryRefreshToken, setSummaryRefreshToken] = React.useState(0);
  const [categoryFilter, setCategoryFilter] = React.useState<{
    id: "none" | string;
    name: string;
  } | null>(null);

  const loadAccounts = React.useCallback(async () => {
    setError(null);
    try {
      const result = await api.get<{ accounts: Account[] }>("/accounts/me");
      setAccounts(result.accounts);
      setSelectedAccountId((current) => current ?? result.accounts[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar las cuentas");
    }
  }, []);

  const loadCategories = React.useCallback(async () => {
    try {
      const result = await api.get<{ categories: Category[] }>("/categories");
      setCategories(result.categories);
    } catch {
      // no bloquea el dashboard si falla
    }
  }, []);

  const loadTransactions = React.useCallback(
    async (accountId: string, categoryId?: "none" | string) => {
      setError(null);
      try {
        const query = categoryId ? `&categoryId=${categoryId}` : "";
        const result = await api.get<{ transactions: Transaction[] }>(
          `/transactions?accountId=${accountId}${query}`
        );
        setTransactions(result.transactions);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "No se pudieron cargar los movimientos");
      }
    },
    []
  );

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadAccounts(), loadCategories()]);
      setLoading(false);
    })();
  }, [loadAccounts, loadCategories]);

  React.useEffect(() => {
    if (selectedAccountId) {
      loadTransactions(selectedAccountId, categoryFilter?.id);
    }
  }, [selectedAccountId, categoryFilter, loadTransactions]);

  React.useEffect(() => {
    setCategoryFilter(null);
  }, [selectedAccountId]);

  // Chequeo silencioso de version nueva del SW al entrar al dashboard, sin
  // recargar la pagina (eso lo hace el propio SW en un reload natural futuro).
  React.useEffect(() => {
    void checkForAppUpdate();
  }, []);

  const refreshData = React.useCallback(async () => {
    setReloading(true);
    try {
      await Promise.all([
        loadAccounts(),
        loadCategories(),
        selectedAccountId ? loadTransactions(selectedAccountId, categoryFilter?.id) : Promise.resolve(),
      ]);
      setSummaryRefreshToken((n) => n + 1);
    } finally {
      setReloading(false);
    }
  }, [loadAccounts, loadCategories, loadTransactions, selectedAccountId, categoryFilter]);

  const exportTransactions = React.useCallback(async () => {
    if (!selectedAccountId) return;
    setExporting(true);
    try {
      await api.download(
        `/transactions/export?accountId=${selectedAccountId}`,
        "movimientos.csv"
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo exportar el extracto");
    } finally {
      setExporting(false);
    }
  }, [selectedAccountId]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  // Un total combinado solo tiene sentido sumando montos de la MISMA moneda:
  // sumar EUR + COP como si fueran lo mismo seria un numero falso, no un total.
  // Se agrupa por moneda y se muestra cada subtotal por separado.
  const balanceByCurrency = accounts.reduce<Record<string, number>>((acc, a) => {
    acc[a.currency] = (acc[a.currency] ?? 0) + Number(a.balance);
    return acc;
  }, {});
  const currenciesInUse = Object.keys(balanceByCurrency);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <h1 className="text-lg font-semibold">App Financiera</h1>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Exportar movimientos"
              disabled={exporting || !selectedAccountId}
              onClick={() => void exportTransactions()}
            >
              <Download className={exporting ? "h-4 w-4 animate-pulse" : "h-4 w-4"} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Sincronizar datos"
              disabled={reloading}
              onClick={() => void refreshData()}
            >
              <RefreshCw className={reloading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            </Button>
            <Button variant="ghost" onClick={logout}>
              Cerrar sesion
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 p-4">
        {error && (
          <Alert variant="destructive" className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => {
                loadAccounts();
                loadCategories();
                if (selectedAccountId) {
                  loadTransactions(selectedAccountId, categoryFilter?.id);
                }
              }}
            >
              Reintentar
            </Button>
          </Alert>
        )}

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <section className="rounded-lg bg-primary p-6 text-primary-foreground">
              <p className="text-sm opacity-85">
                {selectedAccount ? selectedAccount.name : "Balance"}
              </p>
              <p className="mb-1 text-3xl font-bold">
                <CountUpNumber
                  value={selectedAccount ? Number(selectedAccount.balance) : 0}
                  formatOptions={formatOptionsFor(selectedAccount?.currency ?? "EUR")}
                />
              </p>
              {accounts.length > 1 && (
                <p className="mb-4 text-xs opacity-70">
                  Total combinado:{" "}
                  {currenciesInUse
                    .map((currency) => formatMoney(balanceByCurrency[currency], currency))
                    .join(" · ")}
                </p>
              )}
              <div className={cn("flex flex-wrap items-center gap-2", accounts.length <= 1 && "mt-4")}>
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => setSelectedAccountId(account.id)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                      account.id === selectedAccountId
                        ? "bg-primary-foreground text-primary"
                        : "bg-primary-foreground/20 hover:bg-primary-foreground/30"
                    )}
                  >
                    {account.name}
                  </button>
                ))}
                <NewAccountDialog
                  onCreated={(account) => {
                    setAccounts((prev) => [...prev, { ...account, isOwn: true, roleInGroup: null, balance: "0.00" }]);
                    setSelectedAccountId(account.id);
                  }}
                />
              </div>
            </section>

            {selectedAccount && (
              <>
                <MonthlySummaryCard
                  key={selectedAccount.id}
                  accountId={selectedAccount.id}
                  accountCurrency={selectedAccount.currency}
                  refreshToken={summaryRefreshToken}
                  activeFilter={categoryFilter?.id ?? null}
                  onSelectCategory={(categoryId, categoryName) =>
                    setCategoryFilter(categoryId ? { id: categoryId, name: categoryName } : null)
                  }
                />

                <Card>
                  <CardHeader className="pb-0">
                    <h2 className="text-base font-semibold">
                      Movimientos de {selectedAccount.name}
                    </h2>
                  </CardHeader>
                  <CardContent>
                    {categoryFilter && (
                      <div className="mb-3 flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Filtrando por:</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-accent-foreground">
                          {categoryFilter.name}
                          <button
                            type="button"
                            onClick={() => setCategoryFilter(null)}
                            className="ml-1 hover:text-foreground"
                            aria-label="Quitar filtro"
                          >
                            ×
                          </button>
                        </span>
                      </div>
                    )}

                    <TransactionList
                      transactions={transactions}
                      accountId={selectedAccount.id}
                      accountCurrency={selectedAccount.currency}
                      filtered={Boolean(categoryFilter)}
                    />
                  </CardContent>
                </Card>

                <NewTransactionDialog
                  accounts={accounts}
                  categories={categories}
                  currentAccountId={selectedAccount.id}
                  onCreated={async () => {
                    await Promise.all([
                      loadAccounts(),
                      loadTransactions(selectedAccount.id, categoryFilter?.id),
                    ]);
                    setSummaryRefreshToken((n) => n + 1);
                  }}
                />
              </>
            )}

            <section>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                Grupos e invitaciones
              </h2>
              <GroupsAndInvitesSection accounts={accounts} onChanged={loadAccounts} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
