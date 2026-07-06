import cors from "cors";
import express from "express";
import { env } from "./lib/env";
import { authRouter } from "./modules/auth/auth.routes";
import { accountsRouter } from "./modules/accounts/accounts.routes";
import { groupsRouter } from "./modules/groups/groups.routes";
import { invitesRouter } from "./modules/invites/invites.routes";
import { transactionsRouter } from "./modules/transactions/transactions.routes";
import { categoriesRouter } from "./modules/categories/categories.routes";
import { errorHandler } from "./middleware/error-handler";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin ?? true }));
  app.use(express.json());

  app.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/auth", authRouter);
  app.use("/accounts", accountsRouter);
  app.use("/groups", groupsRouter);
  app.use("/invites", invitesRouter);
  app.use("/transactions", transactionsRouter);
  app.use("/categories", categoriesRouter);

  app.use(errorHandler);

  return app;
}
