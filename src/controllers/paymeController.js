import * as service from "../services/paymeService.js";
import { PaymeError } from "../utils/errors.js";

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

    default:
      result = PaymeError.methodNotFound(id);
  }

  res.json({
    jsonrpc: "2.0",
    ...result,
  });
};