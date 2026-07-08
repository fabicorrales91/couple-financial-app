import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import type { Category, Transaction } from "../lib/types";

const schema = z.object({
  amount: z.coerce.number().positive("Debe ser mayor que 0"),
  concept: z.string().min(1, "Requerido").max(200),
  categoryId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

/**
 * Edita monto, categoria y concepto de un movimiento ya registrado. No
 * permite cambiar tipo ni cuentas: eso equivale a borrar y crear uno nuevo.
 * `transaction` null = dialog cerrado (patron controlado, sin trigger propio,
 * se abre desde el click en una fila de TransactionList).
 */
export function EditTransactionDialog({
  transaction,
  categories,
  onClose,
  onUpdated,
}: {
  transaction: Transaction | null;
  categories: Category[];
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Precarga el formulario cada vez que se abre un movimiento (o uno distinto).
  React.useEffect(() => {
    if (transaction) {
      reset({
        amount: Number(transaction.amount),
        concept: transaction.concept,
        categoryId: transaction.category?.id ?? "",
      });
      setError(null);
    }
  }, [transaction, reset]);

  async function onSubmit(values: FormValues) {
    if (!transaction) return;
    setError(null);
    try {
      await api.patch(`/transactions/${transaction.id}`, {
        amount: values.amount,
        concept: values.concept,
        categoryId: values.categoryId || null,
      });
      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo actualizar el movimiento");
    }
  }

  return (
    <Dialog open={Boolean(transaction)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar movimiento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <Alert variant="destructive">{error}</Alert>}

          <div className="space-y-2">
            <Label htmlFor="editAmount">Monto</Label>
            <Input id="editAmount" type="number" step="0.01" {...register("amount")} />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="editConcept">Concepto</Label>
            <Input id="editConcept" {...register("concept")} />
            {errors.concept && (
              <p className="text-sm text-destructive">{errors.concept.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="editCategoryId">Categoria</Label>
            <select
              id="editCategoryId"
              className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar cambios"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
