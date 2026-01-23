const tg = window.Telegram.WebApp;
tg.ready();

const userSpan = document.getElementById("user");
const balanceEl = document.getElementById("balance");

// Telegram user
const telegramUser = tg.initDataUnsafe?.user;

let telegram_id = telegramUser?.id || "demo_user";
let name = telegramUser?.first_name || "Guest";

// Show user
userSpan.innerText = name;

// Create user on backend
fetch("/user", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    telegram_id,
    name
  })
})
.then(res => res.json())
.then(data => {
  balanceEl.innerText = "₦" + data.balance;
});

// FUND WALLET (placeholder)
function fundWallet() {
  const amount = document.getElementById("fundAmount").value;
  if (!amount) {
    alert("Enter amount");
    return;
  }
  alert("Flutterwave will be connected here later");
}

// BUY DATA
function buyData() {
  const network = document.getElementById("network").value;
  const plan = document.getElementById("plan").value;
  const phone = document.getElementById("phone").value;

  if (!plan || !phone) {
    alert("Fill all fields");
    return;
  }

  fetch("/buy-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telegram_id,
      network,
      plan,
      phone,
      amount: 100 // placeholder
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      alert(data.error);
    } else {
      alert("Data purchase successful");
      balanceEl.innerText =
        "₦" + (parseInt(balanceEl.innerText.replace("₦","")) - 100);
    }
  });
}