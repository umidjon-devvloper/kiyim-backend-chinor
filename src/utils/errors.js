// Payme Error Codes according to Payme docs
export const PaymeError = {
  orderNotFound: (id) => ({
    error: { 
      code: -31050, 
      message: { 
        uz: "Buyurtma topilmadi",
        ru: "Заказ не найден",
        en: "Order not found" 
      } 
    },
    id,
  }),

  wrongAmount: (id) => ({
    error: { 
      code: -31001, 
      message: { 
        uz: "Noto'g'ri summa",
        ru: "Неверная сумма",
        en: "Wrong amount" 
      } 
    },
    id,
  }),

  cantDoOperation: (id) => ({
    error: { 
      code: -31008, 
      message: { 
        uz: "Operatsiyani bajarish mumkin emas",
        ru: "Невозможно выполнить операцию",
        en: "Cannot perform operation" 
      } 
    },
    id,
  }),

  transactionNotFound: (id) => ({
    error: { 
      code: -31003, 
      message: { 
        uz: "Tranzaksiya topilmadi",
        ru: "Транзакция не найдена",
        en: "Transaction not found" 
      } 
    },
    id,
  }),

  alreadyDone: (id) => ({
    error: { 
      code: -31051, 
      message: { 
        uz: "Allaqachon bajarilgan",
        ru: "Уже выполнено",
        en: "Already done" 
      } 
    },
    id,
  }),

  pending: (id) => ({
    error: { 
      code: -31052, 
      message: { 
        uz: "Kutilmoqda",
        ru: "В ожидании",
        en: "Pending" 
      } 
    },
    id,
  }),

  methodNotFound: (id) => ({
    error: { 
      code: -32601, 
      message: { 
        uz: "Metod topilmadi",
        ru: "Метод не найден",
        en: "Method not found" 
      } 
    },
    id,
  }),
};