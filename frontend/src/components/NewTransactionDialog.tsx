import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert } from "./ui/alert";
import { api, ApiError } from "../lib/api";
import type { Account, Category, TransactionType } from "../lib/types";

const schema = z.object({
  amount: z.coerce.number().positive("Debe ser mayor que 0"),
  concept: z.string().min(1, "Requerido").max(200),
  categoryId: z.string().optional(),
  otherAccountId: z.string().optional(),
  isRemesa: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export function NewTransactionDialog({
  accounts,
  categories,
  currentAccountId,
  onCreated,
}: {
  accounts: Account[];
  categories: Category[];
  currentAccountId: string;
  onCreated: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<TransactionType>("gasto");
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const otherAccounts = accounts.filter((a) => a.id !== currentAccountId);

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      const base = {
        amount: values.amount,
        concept: values.concept,
        categoryId: values.categoryId || undefined,
        isRemesa: values.isRemesa ?? false,
      };

      if (type === "gasto") {
        await api.post("/transactions", {
          type,
          fromAccountId: currentAccountId,
          ...base,
        });
      } else if (type === "ingreso") {
        await api.post("/transactions", {
          type,
          toAccountId: currentAccountId,
          ...base,
        });
      } else {
        if (!values.otherAccountId) {
          setError("Selecciona la cuenta destino");
          return;
        }
        await api.post("/transactions", {
          type,
          fromAccountId: currentAccountId,
          toAccountId: values.otherAccountId,
          ...base,
        });
      }

      reset();
      setOpen(false);
      await onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar el movimiento");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full p-0 shadow-[0_10px_24px_rgba(156,66,54,0.35)]"
          style={{
            // Base garantizada: bottom-6/right-6 (clases Tailwind). El safe-area se
            // suma como margen ADITIVO, nunca reemplaza el offset: si env() no
            // resuelve en algun navegador, el margin cae a 0 y el FAB sigue
            // exactamente donde bottom-6/right-6 lo dejan (nunca desaparece).
            marginBottom: "env(safe-area-inset-bottom, 0px)",
            marginRight: "env(safe-area-inset-right, 0px)",
          }}
          aria-label="Nuevo movimiento"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar movimiento</DialogTitle>
        </DialogHeader>

        <Tabs value={type} onValueChange={(v) => setType(v as TransactionType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gasto">Gasto</TabsTrigger>
            <TabsTrigger value="ingreso">Ingreso</TabsTrigger>
            <TabsTrigger value="transferencia">Transferencia</TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          {error && <Alert variant="destructive">{error}</Alert>}

          <div className="space-y-2">
            <Label htmlFor="amount">Monto</Label>
            <Input id="amount" type="number" step="0.01" {...register("amount")} />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="concept">Concepto</Label>
            <Input id="concept" placeholder="Supermercado, alquiler..." {...register("concept")} />
            {errors.concept && (
              <p className="text-sm text-destructive">{errors.concept.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryId">Categoria</Label>
            <select
              id="categoryId"
              className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
              {...register("categoryId")}
            >
              <option value="">Sin categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {type === "transferencia" && (
            <div className="space-y-2">
              <Label htmlFor="otherAccountId">Cuenta destino</Label>
              <select
                id="otherAccountId"
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
                {...register("otherAccountId")}
              >
                <option value="">Selecciona una cuenta</option>
                {otherAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Solo puedes transferir a tus propias cuentas, grupos donde eres miembro, o
                contactos con vinculo aceptado.
              </p>
            </div>
          )}

          <div className="flex items-start gap-2">
            <input
              id="isRemesa"
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-input"
              {...register("isRemesa")}
            />
            <Label htmlFor="isRemesa" className="font-normal leading-tight">
              Es una remesa
              <span className="block text-xs font-normal text-muted-foreground">
                Envio o recepcion de dinero entre paises o monedas
              </span>
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
