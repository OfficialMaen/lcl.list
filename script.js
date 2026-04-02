const API = window.location.origin;

function openMenu() { document.getElementById("sidebar").style.left = "0"; }
function closeMenu() { document.getElementById("sidebar").style.left = "-260px"; }

function register() {
    let username = document.getElementById("username").value;
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    if (!username || !email || !password) return alert("Fill all fields");

    fetch(API + "/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
    }).then(r => r.json()).then(data => {
        if (data.success) { alert("Account created! Please login."); window.location = "login.html"; }
        else alert("Registration failed");
    });
}

function login() {
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    fetch(API + "/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    }).then(r => r.json()).then(data => {
        if (data.success) {
            localStorage.setItem("logged", "true");
            localStorage.setItem("username", data.username);
            localStorage.setItem("admin", data.admin ? "true" : "false");
            alert("Logged in!"); window.location = "index.html";
        } else alert("Wrong credentials");
    });
}

window.onload = function() {
    loadLeaderboard();
    if (localStorage.getItem("admin") === "true") {
        document.getElementById("adminPanel").style.display = "block";
        showNotifications();
    }
    if (localStorage.getItem("logged") === "true") {
        document.getElementById("userText").innerText = "Logged in as: " + localStorage.getItem("username");
    }
};

function loadLeaderboard() {
    let board = document.getElementById("leaderboard");
    if (!board) return;
    fetch(API + "/api/leaderboard").then(r => r.json()).then(list => {
        board.innerHTML = "";
        list.forEach((lvl, i) => {
            let id = lvl.video.includes("v=") ? lvl.video.split("v=")[1].split("&")[0] : lvl.video.split("youtu.be/")[1].split("?")[0];
            let thumb = "https://img.youtube.com/vi/" + id + "/hqdefault.jpg";
            let admin = (localStorage.getItem("admin") === "true") ? `<br><button onclick="moveUp(${i})">UP</button><button onclick="moveDown(${i})">DOWN</button><button onclick="deleteLevel(${i})">DEL</button>` : "";
            board.innerHTML += `<div class="level-card"><h3>#${i+1} ${lvl.name}</h3><img src="${thumb}" width="300"><br>Creator: ${lvl.creator}${admin}</div>`;
        });
    });
}

function showNotifications() {
    let box = document.getElementById("notifications");
    fetch(API + "/api/submissions").then(r => r.json()).then(subs => {
        box.innerHTML = subs.length ? "" : "No pending levels";
        subs.forEach((lvl, i) => {
            box.innerHTML += `<div class="notification"><b>${lvl.name}</b><br><button onclick="approveLevel(${i})">Approve</button></div>`;
        });
    });
}

function moveUp(index) { fetch(API + "/api/moveUp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ index }) }).then(() => location.reload()); }
function moveDown(index) { fetch(API + "/api/moveDown", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ index }) }).then(() => location.reload()); }
function approveLevel(index) { fetch(API + "/api/approveLevel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ index }) }).then(() => location.reload()); }
function deleteLevel(index) { fetch(API + "/api/deleteLevel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ index }) }).then(() => location.reload()); }
function sendLevel() {
    let name = document.getElementById("levelname").value;
    let id = document.getElementById("levelid").value;
    let creator = document.getElementById("creator").value;
    let video = document.getElementById("video").value;
    fetch(API + "/api/submitLevel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, id, creator, video }) }).then(() => alert("Sent!"));
}
function logout() { localStorage.clear(); location.reload(); }
