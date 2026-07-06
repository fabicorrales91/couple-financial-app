import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert } from "./ui/alert";
import { api, ApiError } from "../lib/api";
import type { Account } from "../lib/types";

export function GroupsAndInvitesSection({
  accounts,
  onChanged,
}: {
  accounts: Account[];
  onChanged: () => void;
}) {
  const [groupName, setGroupName] = React.useState("");
  const [groupError, setGroupError] = React.useState<string | null>(null);
  const [groupMessage, setGroupMessage] = React.useState<string | null>(null);

  const [inviteError, setInviteError] = React.useState<string | null>(null);
  const [lastCode, setLastCode] = React.useState<string | null>(null);

  const [redeemCode, setRedeemCode] = React.useState("");
  const [redeemError, setRedeemError] = React.useState<string | null>(null);
  const [redeemMessage, setRedeemMessage] = React.useState<string | null>(null);

  const [busy, setBusy] = React.useState(false);

  const groupsIAdmin = accounts.filter(
    (a) => a.type === "group" && a.roleInGroup === "admin"
  );

  async function createGroup() {
    setGroupError(null);
    setGroupMessage(null);

    if (!groupName.trim()) {
      setGroupError("Escribe un nombre para el grupo");
      return;
    }

    setBusy(true);
    try {
      await api.post("/groups", { name: groupName.trim() });
      setGroupName("");
      setGroupMessage("Grupo creado correctamente");
      await onChanged();
    } catch (err) {
      setGroupError(err instanceof ApiError ? err.message : "No se pudo crear el grupo");
    } finally {
      setBusy(false);
    }
  }

  async function createContactInvite() {
    setBusy(true);
    setInviteError(null);
    setLastCode(null);
    try {
      const result = await api.post<{ invite: { code: string } }>("/invites", {
        type: "contact",
      });
      setLastCode(result.invite.code);
    } catch (err) {
      setInviteError(err instanceof ApiError ? err.message : "No se pudo generar el codigo");
    } finally {
      setBusy(false);
    }
  }

  async function createGroupInvite(groupAccountId: string) {
    setBusy(true);
    setInviteError(null);
    setLastCode(null);
    try {
      const result = await api.post<{ invite: { code: string } }>("/invites", {
        type: "group",
        groupAccountId,
      });
      setLastCode(result.invite.code);
    } catch (err) {
      setInviteError(err instanceof ApiError ? err.message : "No se pudo generar el codigo");
    } finally {
      setBusy(false);
    }
  }

  async function redeem() {
    setRedeemError(null);
    setRedeemMessage(null);

    if (!redeemCode.trim()) {
      setRedeemError("Escribe el codigo de invitacion");
      return;
    }

    setBusy(true);
    try {
      await api.post("/invites/redeem", { code: redeemCode.trim() });
      setRedeemCode("");
      setRedeemMessage("Vinculo creado correctamente");
      await onChanged();
    } catch (err) {
      setRedeemError(err instanceof ApiError ? err.message : "No se pudo canjear el codigo");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Crear grupo</CardTitle>
          <CardDescription>Una cuenta compartida, tu quedas como admin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {groupError && <Alert variant="destructive">{groupError}</Alert>}
          {groupMessage && <Alert>{groupMessage}</Alert>}
          <Label htmlFor="groupName">Nombre del grupo</Label>
          <Input
            id="groupName"
            placeholder="Hogar"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          <Button onClick={createGroup} disabled={busy} className="w-full">
            Crear grupo
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invitar</CardTitle>
          <CardDescription>Genera un codigo para vincular un contacto o sumar a un grupo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {inviteError && <Alert variant="destructive">{inviteError}</Alert>}
          <Button variant="outline" onClick={createContactInvite} disabled={busy} className="w-full">
            Generar codigo de contacto
          </Button>

          {groupsIAdmin.map((g) => (
            <Button
              key={g.id}
              variant="outline"
              onClick={() => createGroupInvite(g.id)}
              disabled={busy}
              className="w-full"
            >
              Invitar a {g.name}
            </Button>
          ))}

          {lastCode && (
            <Alert>
              Codigo generado: <span className="font-mono font-semibold">{lastCode}</span>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Canjear un codigo</CardTitle>
          <CardDescription>Pega el codigo que te compartieron</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {redeemError && <Alert variant="destructive">{redeemError}</Alert>}
          {redeemMessage && <Alert>{redeemMessage}</Alert>}
          <div className="flex gap-2">
            <Input
              placeholder="Codigo de invitacion"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value)}
            />
            <Button onClick={redeem} disabled={busy}>
              Canjear
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
