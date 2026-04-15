export const paymeAuth = (req, res, next) => {
  const auth = req.headers["authorization"];

  if (!auth) return res.status(401).send("Unauthorized");

  const base64 = auth.split(" ")[1];
  const decoded = Buffer.from(base64, "base64").toString();

  const [login, password] = decoded.split(":");

  if (
    login !== "Paycom" ||
    password !== process.env.PAYME_KEY
  ) {
    return res.status(401).send("Unauthorized");
  }

  next();
};