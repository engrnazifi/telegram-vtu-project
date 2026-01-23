const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path");
const crypto = require("crypto");

const app = express();

/* =======================
   MIDDLEWARE
======================= */
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

/* =======================
   STATIC MINI APP
======================= */
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =======================
   ENV CONFIG (RENDER)
======================= */
const PORT = process.env.PORT || 3000;

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY; // LIVE KEY
const FLW_WEBHOOK_SECRET = process.env.FLW_WEBHOOK_SECRET;
const ADMIN_ID = process.env.ADMIN_ID; // telegram numeric id

if (!FLW_SECRET_KEY || !FLW_WEBHOOK_SECRET || !ADMIN_ID) {
  console.error("❌ Missing ENV variables");
}

/* =======================
   IN-MEMORY DB (DEMO)
======================= */
let users = {};
let transactions = [];

/* =======================
   ADMIN SETTINGS
======================= */
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

  if (!telegram_id) {
    return res.status(400).json({ error: "telegram_id required" });
  }

  if (!users[telegram_id]) {
    users[telegram_id] = {
      telegram_id,
      name: name || "Telegram User",
      balance: 0
    };
  }

  res.json(users[telegram_id]);
});

app.get("/user/:id", (req, res) => {
  res.json(users[req.params.id] || null);
});

/* =======================
   ADMIN – UPDATE PRICE
======================= */
app.post("/admin/update-price", (req, res) => {
  const { admin_id, network, plan, price } = req.body;

  if (String(admin_id) !== String(ADMIN_ID)) {
    return res.status(403).json({ error: "Not authorized" });
  }

  if (!settings[network]) settings[network] = {};
  settings[network][plan] = Number(price);

  res.json({ success: true, settings });
});

/* =======================
   FLUTTERWAVE – INIT PAYMENT
======================= */
app.post("/pay", async (req, res) => {
  const { telegram_id, amount } = req.body;

  if (!telegram_id || !amount) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const tx_ref = "TX_" + Date.now() + "_" + telegram_id;

  try {
    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      {
        tx_ref,
        amount,
        currency: "NGN",
        redirect_url: "https://t.me/your_bot_username",
        customer: {
          email: `${telegram_id}@telegram.com`
        },
        customizations: {
          title: "VTU Wallet Funding"
        }
      },
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({
      payment_link: response.data.data.link,
      tx_ref
    });
  } catch (err) {
    console.error("❌ FLW INIT ERROR", err.response?.data || err.message);
    res.status(500).json({ error: "Payment init failed" });
  }
});

/* =======================
   FLUTTERWAVE WEBHOOK
======================= */
app.post("/webhook/flutterwave", (req, res) => {
  const signature = req.headers["verif-hash"];

  if (!signature || signature !== FLW_WEBHOOK_SECRET) {
    console.log("❌ Invalid webhook signature");
    return res.sendStatus(401);
  }

  const event = req.body;

  if (event.status === "successful") {
    const telegram_id = event.customer.email.split("@")[0];
    const amount = Number(event.amount);

    if (users[telegram_id]) {
      users[telegram_id].balance += amount;

      transactions.push({
        id: Date.now(),
        telegram_id,
        amount,
        type: "FUND",
        status: "SUCCESS"
      });

      console.log("✅ WALLET FUNDED:", telegram_id, amount);
    }
  }

  res.sendStatus(200);
});

/* =======================
   VTU PLACEHOLDER
======================= */
async function buyFromVTU(network, plan, phone) {
  // ⚠️ PLACEHOLDER – replace with VTU.ng later
  return {
    status: "SUCCESS",
    vendor_ref: "VTU_" + Date.now()
  };
}

/* =======================
   BUY DATA
======================= */
app.post("/buy-data", async (req, res) => {
  const { telegram_id, network, plan, phone } = req.body;

  const user = users[telegram_id];
  if (!user) return res.status(400).json({ error: "User not found" });

  const price = settings[network]?.[plan];
  if (!price) return res.status(400).json({ error: "Invalid plan" });

  if (user.balance < price)
    return res.status(400).json({ error: "Low balance" });

  const vtu = await buyFromVTU(network, plan, phone);
  if (vtu.status !== "SUCCESS") {
    return res.status(500).json({ error: "VTU failed" });
  }

  user.balance -= price;

  const tx = {
    id: Date.now(),
    telegram_id,
    network,
    plan,
    phone,
    amount: price,
    type: "DATA",
    vendor_ref: vtu.vendor_ref,
    status: "SUCCESS"
  };

  transactions.push(tx);

  res.json({
    success: true,
    tx,
    balance: user.balance
  });
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
app.listen(PORT, () => {
  console.log("✅ VTU Backend + Mini App running on port", PORT);
});