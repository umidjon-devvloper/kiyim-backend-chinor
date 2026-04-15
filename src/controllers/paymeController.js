// Docs loyihasiga to'liq mos: switch(method) pattern
import {
  checkPerformTransaction,
  createTransaction,
  performTransaction,
  cancelTransaction,
  checkTransaction,
  getStatement,
} from "../services/paymeService.js";
import { PaymeError } from "../utils/errors.js";

const METHODS = {
  CheckPerformTransaction: checkPerformTransaction,
  CreateTransaction:       createTransaction,
  PerformTransaction:      performTransaction,
  CancelTransaction:       cancelTransaction,
  CheckTransaction:        checkTransaction,
  GetStatement:            getStatement,
};

export const handlePayme = async (req, res, next) => {
  try {
    const { id, method, params } = req.body;

    if (!method) {
      return res.json(PaymeError.parse(id || null));
    }

    const handler = METHODS[method];
    if (!handler) {
      return res.json(PaymeError.methodNotFound(id));
    }

    const result = await handler({ id, params });
    return res.json(result);
  } catch (error) {
    console.error("Payme error:", error);
    const { id } = req.body || {};
    return res.json(PaymeError.internalError(id || null));
  }
};
