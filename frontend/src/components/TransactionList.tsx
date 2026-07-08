import type { Transaction } from "../lib/types";
import { getTransactionIcon } from "../lib/category-icons";
import { formatMoney } from "../lib/currency";
import { cn } from "../lib/utils";

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
  accountCurrency,
  filtered = false,
}: {
  transactions: Transaction[];
  accountId: string;
  accountCurrency: string;
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
      {transactions.map((tx, index) => {
        const sign = signFor(tx, accountId);
        const Icon = getTransactionIcon(tx.category?.name, tx.type);
        return (
          <li
            key={tx.id}
            className="flex animate-fade-slide-in items-center gap-3 py-3"
            style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
          >
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
                {tx.isRemesa ? " · Remesa" : ""}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 font-semibold",
                sign === "+" ? "text-secondary" : "text-destructive"
              )}
            >
              {sign}
              {formatMoney(tx.amount, accountCurrency)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
