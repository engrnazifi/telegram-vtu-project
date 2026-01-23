const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(bodyParser.json());

/* =======================
   CONFIG
======================= */
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY || "FLW_TEST_SECRET_KEY";

/* =======================
   FAKE DATABASE
======================= */
let users = {};
let transactions = [];

let settings = {
  MTN: { "1GB": 300, "2GB": 600 },
  AIRTEL: { "1GB": 320 },
  GLO: { "1GB": 280 },
  "9MOBILE": { "1GB": 350 }
};

/* =======================
   USER
======================= */
app.post("/user", (req, res) => {
  const { telegram_id, name } = req.body;

  if (!users[telegram_id]) {
    users[telegram_id] = {
      telegram_id,
      name,
      balance: 0
    };
  }
  res.json(users[telegram_id]);
});

app.get("/user/:id", (req, res) => {
  res.json(users[req.params.id]);
});

/* =======================
   ADMIN (UPDATE PRICES)
======================= */
app.post("/admin/update-price", (req, res) => {
  const { network, plan, price } = req.body;

  if (!settings[network]) settings[network] = {};
  settings[network][plan] = price;

  res.json({ success: true, settings });
});

/* =======================
   FLUTTERWAVE PAYMENT
======================= */
app.post("/pay", async (req, res) => {
  const { telegram_id, amount } = req.body;

  try {
    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      {
        tx_ref: "TX_" + Date.now(),
        amount,
        currency: "NGN",
        redirect_url: "https://your-frontend-url/success.html",
        customer: {
          email: `${telegram_id}@telegram.com`
        },
        customizations: {
          title: "VTU Wallet Funding"
        }
      },
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`
        }
      }
    );

    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Payment failed" });
  }
});

/* =======================
   BUY DATA
======================= */
app.post("/buy-data", (req, res) => {
  const { telegram_id, network, plan, phone } = req.body;
  const user = users[telegram_id];

  if (!user) return res.status(400).json({ error: "User not found" });

  const price = settings[network]?.[plan];
  if (!price) return res.status(400).json({ error: "Invalid plan" });

  if (user.balance < price)
    return res.status(400).json({ error: "Low balance" });

  user.balance -= price;

  const tx = {
    id: Date.now(),
    telegram_id,
    network,
    plan,
    phone,
    amount: price,
    status: "SUCCESS"
  };

  transactions.push(tx);
  res.json({ success: true, tx, balance: user.balance });
});

/* =======================
   TRANSACTIONS
======================= */
app.get("/transactions/:id", (req, res) => {
  res.json(transactions.filter(t => t.telegram_id == req.params.id));
});

/* =======================
   SERVER
======================= */
app.listen(process.env.PORT || 3000, () =>
  console.log("✅ Backend running")
);