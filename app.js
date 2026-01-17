const tg = window.Telegram.WebApp;
tg.ready();

const userId = tg.initDataUnsafe.user.id;
const name = tg.initDataUnsafe.user.first_name;

document.getElementById("user").innerText = name;

const API = "https://YOUR-RENDER-BACKEND.onrender.com";

fetch(API + "/user", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ telegram_id: userId, name })
})
  .then(res => res.json())
  .then(data => {
    document.getElementById("balance").innerText = "₦" + data.balance;
  });

function buyData() {
  fetch(API + "/buy-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telegram_id: userId,
      network: network.value,
      plan: plan.value,
      phone: phone.value,
      amount: Number(amount.value)
    })
  })
    .then(res => res.json())
    .then(data => {
      alert("Data Purchased");
      location.reload();
    });
}