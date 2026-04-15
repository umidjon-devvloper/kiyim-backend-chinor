export const PaymeError = {
  orderNotFound: (id) => ({
    id,
    error: { code: -31050, message: { en: "Order not found" } },
  }),

  wrongAmount: (id) => ({
    id,
    error: { code: -31001, message: { en: "Wrong amount" } },
  }),

  cantDoOperation: (id) => ({
    id,
    error: { code: -31008, message: { en: "Cannot perform operation" } },
  }),

  transactionNotFound: (id) => ({
    id,
    error: { code: -31003, message: { en: "Transaction not found" } },
  }),

  alreadyDone: (id) => ({
    id,
    error: { code: -31051, message: { en: "Already done" } },
  }),

  pending: (id) => ({
    id,
    error: { code: -31052, message: { en: "Pending" } },
  }),

  methodNotFound: (id) => ({
    id,
    error: { code: -32601, message: { en: "Method not found" } },
  }),
};