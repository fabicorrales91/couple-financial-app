import * as React from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert } from "./ui/alert";
import { api, ApiError } from "../lib/api";
import { COMMON_CURRENCIES } from "../lib/currency";
import type { Account } from "../lib/types";

/**
 * Crea una cuenta personal adicional (ej: una cuenta en COP para seguimiento
 * de familia/ahorros en Colombia, separada de la cuenta principal en EUR).
 * No es una cuenta de grupo: eso ya lo cubre GroupsAndInvitesSection.
 */
export function NewAccountDialog({ onCreated }: { onCreated: (account: Account) => void }) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [currency, setCurrency] = React.useState("EUR");
  const [customCurrency, setCustomCurrency] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const effectiveCurrency = currency === "otra" ? customCurrency.trim().toUpperCase() : currency;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Escribe un nombre para la cuenta");
      return;
    }
    if (!/^[A-Z]{3}$/.test(effectiveCurrency)) {
      setError("La moneda debe ser un codigo de 3 letras, ej: EUR, COP, USD");
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.post<{ account: Account }>("/accounts", {
        name: name.trim(),
        currency: effectiveCurrency,
      });
      setName("");
      setCurrency("EUR");
      setCustomCurrency("");
      setOpen(false);
      onCreated(result.account);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la cuenta");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        className="h-11 w-11 shrink-0 rounded-full border-primary-foreground/40 bg-transparent p-0 text-primary-foreground hover:bg-primary-foreground/20 active:bg-primary-foreground/30"
        aria-label="Nueva cuenta"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva cuenta</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {error && <Alert variant="destructive">{error}</Alert>}

          <div className="space-y-2">
            <Label htmlFor="accountName">Nombre</Label>
            <Input
              id="accountName"
              placeholder="Ahorros Colombia"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountCurrency">Moneda</Label>
            <select
              id="accountCurrency"
              className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {COMMON_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
              <option value="otra">Otra...</option>
            </select>
            {currency === "otra" && (
              <Input
                placeholder="Codigo ISO, ej: BRL"
                maxLength={3}
                value={customCurrency}
                onChange={(e) => setCustomCurrency(e.target.value)}
              />
            )}
            <p className="text-xs text-muted-foreground">
              Los movimientos de esta cuenta se muestran en su propia moneda, sin
              conversion automatica de tipo de cambio.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Creando..." : "Crear cuenta"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
