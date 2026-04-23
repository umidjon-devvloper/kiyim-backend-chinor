import * as service from "../services/paymeService.js";
import { PaymeError } from "../enum/transaction.enum.js";

export const handlePayme = async (req, res) => {
  const { method, params, id } = req.body;

  let result;

  switch (method) {
    case "CheckPerformTransaction":
      result = await service.checkPerformTransaction({ id, params });
      break;

    case "CreateTransaction":
      result = await service.createTransaction({ id, params });
      break;

    case "PerformTransaction":
      result = await service.performTransaction({ id, params });
      break;

    case "CancelTransaction":
      result = await service.cancelTransaction({ id, params });
      break;

    case "CheckTransaction":
      result = await service.checkTransaction({ id, params });
      break;

    case "GetStatement":
      result = await service.getStatement({ id, params });
      break;

    default:
      result = { error: PaymeError.CantDoOperation, id };
  }

  res.json({
    jsonrpc: "2.0",
    ...result,
  });
};
