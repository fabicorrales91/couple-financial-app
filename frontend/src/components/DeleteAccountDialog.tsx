import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Alert } from "./ui/alert";
import { api, ApiError } from "../lib/api";
import type { Account } from "../lib/types";

/**
 * Confirma antes de eliminar una cuenta personal. El backend es quien decide
 * si realmente se puede borrar (sin movimientos, no es la unica cuenta): acá
 * solo mostramos su respuesta si rechaza el pedido, en vez de duplicar esas
 * reglas en el frontend.
 */
export function DeleteAccountDialog({
  account,
  onClose,
  onDeleted,
}: {
  account: Account | null;
  onClose: () => void;
  onDeleted: (accountId: string) => void;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    setError(null);
  }, [account]);

  async function handleDelete() {
    if (!account) return;
    setDeleting(true);
    setError(null);
    try {
      await api.delete(`/accounts/${account.id}`);
      onDeleted(account.id);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo eliminar la cuenta");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={Boolean(account)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar cuenta</DialogTitle>
          <DialogDescription>
            {account && (
              <>
                Vas a eliminar <strong>{account.name}</strong>. Esta accion no se puede deshacer.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {error && <Alert variant="destructive">{error}</Alert>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Eliminando..." : "Eliminar cuenta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
