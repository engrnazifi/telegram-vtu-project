const tg = window.Telegram.WebApp;
tg.ready();

const userId = tg.initDataUnsafe.user.id;
const name = tg.initDataUnsafe.user.first_name;

document.getElementById("user").innerText = name;

const API = "https://telegram-vtu-project.onrender.com";

/* CREATE USER */
fetch(API + "/user", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ telegram_id: userId, name })
})
  .then(res => res.json())
  .then(data => {
    document.getElementById("balance").innerText = "₦" + data.balance;
  });

/* BUY DATA */
function buyData() {
  fetch(API + "/buy-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telegram_id: userId,
      network: network.value,
      plan: plan.value,
      phone: phone.value
    })
  })
    .then(res => res.json())
    .then(data => {
      alert("✅ Data Purchased");
      location.reload();
    });
}

/* FUND WALLET */
function fundWallet() {
  const amount = document.getElementById("fundAmount").value;

  fetch(API + "/pay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegram_id: userId, amount })
  })
    .then(res => res.json())
    .then(data => {
      window.location.href = data.data.link;
    });
}