export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Docs loyihasidagi barcha PaymeError kodlari bilan to'ldirildi
export class PaymeError {
  static parse(id) {
    return {
      id,
      error: {
        code: -32700,
        message: { ru: "Ошибка разбора JSON", uz: "JSON parse xatosi", en: "Parse error" },
      },
    };
  }

  static methodNotFound(id) {
    return {
      id,
      error: {
        code: -32601,
        message: { ru: "Метод не найден", uz: "Metod topilmadi", en: "Method not found" },
      },
    };
  }

  static orderNotFound(id) {
    return {
      id,
      error: {
        code: -31050,
        message: { ru: "Заказ не найден", uz: "Buyurtma topilmadi", en: "Order not found" },
      },
    };
  }

  static wrongAmount(id) {
    return {
      id,
      error: {
        code: -31001,
        message: { ru: "Неверная сумма", uz: "Noto'g'ri summa", en: "Wrong amount" },
      },
    };
  }

  static transactionNotFound(id) {
    return {
      id,
      error: {
        code: -31003,
        message: { ru: "Транзакция не найдена", uz: "Tranzaksiya topilmadi", en: "Transaction not found" },
      },
    };
  }

  static transactionExists(id) {
    return {
      id,
      error: {
        code: -31052,
        message: { ru: "Транзакция уже существует", uz: "Tranzaksiya allaqachon mavjud", en: "Transaction already exists" },
      },
    };
  }

  static transactionCancelled(id) {
    return {
      id,
      error: {
        code: -31008,
        message: { ru: "Транзакция отменена", uz: "Tranzaksiya bekor qilingan", en: "Transaction cancelled" },
      },
    };
  }

  // Docs: CantDoOperation (-31008)
  static cantDoOperation(id) {
    return {
      id,
      error: {
        code: -31008,
        message: { ru: "Мы не можем сделать операцию", uz: "Biz operatsiyani bajara olmaymiz", en: "Can't do operation" },
      },
    };
  }

  // Docs: AlreadyDone (-31060)
  static alreadyDone(id) {
    return {
      id,
      error: {
        code: -31060,
        message: { ru: "Оплачено за товар", uz: "Mahsulot uchun to'lov qilingan", en: "Already paid" },
      },
    };
  }

  // Docs: Pending (-31050)
  static pending(id) {
    return {
      id,
      error: {
        code: -31050,
        message: { ru: "Ожидается оплата", uz: "To'lov kutilayapti", en: "Payment pending" },
      },
    };
  }

  static cannotPerform(id) {
    return {
      id,
      error: {
        code: -31099,
        message: { ru: "Невозможно выполнить транзакцию", uz: "Tranzaksiyani bajarib bo'lmadi", en: "Could not perform transaction" },
      },
    };
  }

  static internalError(id) {
    return {
      id,
      error: {
        code: -32603,
        message: { ru: "Внутренняя ошибка", uz: "Ichki xato", en: "Internal error" },
      },
    };
  }
}
