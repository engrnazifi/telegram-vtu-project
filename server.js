const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

let users = {};
let transactions = [];

/* CREATE USER */
app.post("/user", (req, res) => {
  const { telegram_id, name } = req.body;
  if (!users[telegram_id]) {
    users[telegram_id] = {
      telegram_id,
      name,
      balance: 10000
    };
  }
  res.json(users[telegram_id]);
});

/* GET USER */
app.get("/user/:id", (req, res) => {
  res.json(users[req.params.id]);
});

/* BUY DATA */
app.post("/buy-data", (req, res) => {
  const { telegram_id, network, plan, phone, amount } = req.body;
  const user = users[telegram_id];
  if (!user) return res.status(400).json({ error: "User not found" });
  if (user.balance < amount)
    return res.status(400).json({ error: "Low balance" });

  user.balance -= amount;

  const tx = {
    id: Date.now(),
    network,
    plan,
    phone,
    amount,
    status: "SUCCESS"
  };
  transactions.push(tx);
  res.json({ success: true, tx });
});

/* TRANSACTIONS */
app.get("/transactions/:id", (req, res) => {
  res.json(transactions);
});

app.listen(process.env.PORT || 3000, () =>
  console.log("Backend running")
);