export type AccountType = "personal" | "group";
export type GroupRole = "admin" | "member";
export type TransactionType = "gasto" | "ingreso" | "transferencia";

export interface Account {
  id: string;
  type: AccountType;
  name: string;
  currency: string;
  isOwn: boolean;
  roleInGroup: GroupRole | null;
  balance: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  fromAccountId: string | null;
  toAccountId: string | null;
  amount: string;
  concept: string;
  isRemesa: boolean;
  occurredAt: string;
  category: Category | null;
}

export interface Invite {
  id: string;
  type: "contact" | "group";
  targetId: string;
  code: string;
  expiresAt: string;
}

export interface CategorySummary {
  categoryId: string | null;
  categoryName: string;
  total: string;
}

export interface MonthlySummary {
  month: string;
  totalGasto: string;
  totalIngreso: string;
  previousMonthTotalGasto: string;
  byCategory: CategorySummary[];
}
