// Telegram Mini App Init
const tg = window.Telegram.WebApp;
tg.ready();

// Telegram User Data
const user = tg.initDataUnsafe.user;

const userId = user.id;
const name = user.first_name || "User";

// Show user name
document.getElementById("user").innerText = name;

// ================================
// BACKEND API URL
// ⚠️ CANZA WANNAN KADAI DAGA BAYA
// ================================
const API = "https://YOUR-CYCLIC-PROJECT.cyclic.app";

// ================================
// CREATE / GET USER
// ================================
fetch(API + "/user", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    telegram_id: userId,
    name: name
  })
})
  .then(res => res.json())
  .then(data => {
    if (data.balance !== undefined) {
      document.getElementById("balance").innerText = "₦" + data.balance;
    }
  })
  .catch(err => {
    alert("Backend not reachable");
    console.error(err);
  });

// ================================
// BUY DATA FUNCTION
// ================================
function buyData() {
  const network = document.getElementById("network").value;
  const plan = document.getElementById("plan").value;
  const phone = document.getElementById("phone").value;
  const amount = Number(document.getElementById("amount").value);

  if (!network || !plan || !phone || !amount) {
    alert("Cika dukkan filayen");
    return;
  }

  fetch(API + "/buy-data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      telegram_id: userId,
      network: network,
      plan: plan,
      phone: phone,
      amount: amount
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Data purchased successfully");
        location.reload();
      } else {
        alert(data.error || "Transaction failed");
      }
    })
    .catch(err => {
      alert("Error connecting to server");
      console.error(err);
    });
}