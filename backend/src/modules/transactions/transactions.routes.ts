import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { requireAuth } from "../../middleware/auth";
import { HttpError } from "../../lib/http-error";
import {
  createTransactionSchema,
  listTransactionsSchema,
  monthlySummarySchema,
} from "./transactions.schemas";
import {
  createTransaction,
  listTransactionsForAccount,
  getMonthlySummary,
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
