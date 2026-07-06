import type { Transaction } from "../lib/types";
import { getTransactionIcon } from "../lib/category-icons";
import { cn } from "../lib/utils";

function formatMoney(amount: string) {
  return Number(amount).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function signFor(tx: Transaction, accountId: string) {
  if (tx.toAccountId === accountId) return "+";
  if (tx.fromAccountId === accountId) return "-";
  return "";
}

export function TransactionList({
  transactions,
  accountId,
  filtered = false,
}: {
  transactions: Transaction[];
  accountId: string;
  filtered?: boolean;
}) {
  if (transactions.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {filtered
          ? "No hay movimientos con este filtro."
          : "Todavia no hay movimientos en esta cuenta."}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {transactions.map((tx) => {
        const sign = signFor(tx, accountId);
        const Icon = getTransactionIcon(tx.category?.name, tx.type);
        return (
          <li key={tx.id} className="flex items-center gap-3 py-3">
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                sign === "+" ? "bg-secondary/15 text-secondary" : "bg-primary/15 text-primary"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{tx.concept}</p>
              <p className="truncate text-xs text-muted-foreground">
                {formatDate(tx.occurredAt)}
                {tx.category ? ` · ${tx.category.name}` : ""}
                {tx.type === "transferencia" ? " · Transferencia" : ""}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 font-semibold",
                sign === "+" ? "text-secondary" : "text-destructive"
              )}
            >
              {sign}
              {formatMoney(tx.amount)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
