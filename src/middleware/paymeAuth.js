// Docs loyihasiga mos: PAYME_MERCHANT_KEY ni base64 token ichida qidiradi
// Payme serveri: Authorization: Basic base64("Paycom:<MERCHANT_KEY>")

export const paymeAuth = (req, res, next) => {
  try {
    const { id } = req.body;
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.json({
        id,
        error: {
          code: -32504,
          message: {
            uz: "Avtorizatsiya yaroqsiz",
            ru: "Авторизация недействительна",
            en: "Authorization invalid",
          },
        },
      });
    }

    const decoded = Buffer.from(token, "base64").toString("utf8");

    const PAYME_MERCHANT_KEY = process.env.PAYME_MERCHANT_KEY;

    if (!decoded.includes(PAYME_MERCHANT_KEY)) {
      return res.json({
        id,
        error: {
          code: -32504,
          message: {
            uz: "Avtorizatsiya yaroqsiz",
            ru: "Авторизация недействительна",
            en: "Authorization invalid",
          },
        },
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};
