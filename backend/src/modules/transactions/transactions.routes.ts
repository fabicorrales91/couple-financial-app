import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { requireAuth } from "../../middleware/auth";
import { HttpError } from "../../lib/http-error";
import {
  createTransactionSchema,
  listTransactionsSchema,
  monthlySummarySchema,
  exportTransactionsSchema,
  updateTransactionSchema,
} from "./transactions.schemas";
import {
  createTransaction,
  listTransactionsForAccount,
  getMonthlySummary,
  listAllTransactionsForExport,
  buildTransactionsCsv,
  updateTransaction,
} from "./transactions.service";

export const transactionsRouter = Router();

transactionsRouter.use(requireAuth);

transactionsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    if (!req.auth) throw HttpError.unauthorized();
    const body = createTransactionSchema.parse(req.body);
    const transaction = await createTransaction(req.auth.userId, body);
    res.status(201).json({ transaction });
  })
);

transactionsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    if (!req.auth) throw HttpError.unauthorized();
    const query = listTransactionsSchema.parse(req.query);
    const transactions = await listTransactionsForAccount(
      req.auth.userId,
      query.accountId,
      query.limit,
      query.categoryId
    );
    res.json({ transactions });
  })
);

transactionsRouter.get(
  "/summary",
  asyncHandler(async (req, res) => {
    if (!req.auth) throw HttpError.unauthorized();
    const query = monthlySummarySchema.parse(req.query);
    const summary = await getMonthlySummary(req.auth.userId, query.accountId, query.month);
    res.json({ summary });
  })
);

transactionsRouter.get(
  "/export",
  asyncHandler(async (req, res) => {
    if (!req.auth) throw HttpError.unauthorized();
    const query = exportTransactionsSchema.parse(req.query);
    const transactions = await listAllTransactionsForExport(req.auth.userId, query.accountId);
    const csv = buildTransactionsCsv(transactions, query.accountId);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="movimientos.csv"');
    res.send(csv);
  })
);

transactionsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    if (!req.auth) throw HttpError.unauthorized();
    const transactionId = req.params.id;
    if (!transactionId) throw HttpError.badRequest("Falta el id del movimiento");
    const body = updateTransactionSchema.parse(req.body);
    const transaction = await updateTransaction(req.auth.userId, transactionId, body);
    res.json({ transaction });
  })
);
