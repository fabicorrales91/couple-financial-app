import * as React from "react";
import type { Category, Transaction } from "../lib/types";
import { getTransactionIcon } from "../lib/category-icons";
import { formatMoney } from "../lib/currency";
import { cn } from "../lib/utils";
import { EditTransactionDialog } from "./EditTransactionDialog";

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
  categories,
  onUpdated,
  filtered = false,
}: {
  transactions: Transaction[];
  accountId: string;
  accountCurrency: string;
  categories: Category[];
  onUpdated: () => void;
  filtered?: boolean;
}) {
  const [editingTx, setEditingTx] = React.useState<Transaction | null>(null);

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
    <>
      <ul className="divide-y divide-border">
        {transactions.map((tx, index) => {
          const sign = signFor(tx, accountId);
          const Icon = getTransactionIcon(tx.category?.name, tx.type);
          return (
            <li
              key={tx.id}
              className="animate-fade-slide-in"
              style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
            >
              <button
                type="button"
                onClick={() => setEditingTx(tx)}
                className="-mx-1 flex w-full items-center gap-3 rounded-md px-1 py-3 text-left transition-colors hover:bg-accent active:bg-accent"
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
              </button>
            </li>
          );
        })}
      </ul>

      <EditTransactionDialog
        transaction={editingTx}
        categories={categories}
        onClose={() => setEditingTx(null)}
        onUpdated={onUpdated}
      />
    </>
  );
}
