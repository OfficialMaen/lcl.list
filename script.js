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
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) { alert("Account created! Please login."); window.location = "login.html"; }
        else alert(data.message || "Failed");
    });
}

function login() {
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    fetch(API + "/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem("logged", "true");
            localStorage.setItem("username", data.username);
            localStorage.setItem("admin", data.admin ? "true" : "false");
            localStorage.setItem("email", email);
            alert("Logged in!");
            window.location = "index.html";
        } else alert("Wrong credentials");
    });
}

function logout() { localStorage.clear(); alert("Logged out"); window.location = "login.html"; }

window.onload = function() {
    let logged = localStorage.getItem("logged");
    let username = localStorage.getItem("username");
    let admin = localStorage.getItem("admin");
    let userText = document.getElementById("userText");

    if (userText) userText.innerText = (logged === "true") ? "Logged in as: " + username : "Not logged in";
    if (admin === "true") {
        document.getElementById("adminPanel").style.display = "block";
        showNotifications();
    }
    loadLeaderboard();
};

function sendLevel() {
    if (localStorage.getItem("logged") !== "true") return alert("Login first");
    let name = document.getElementById("levelname").value;
    let id = document.getElementById("levelid").value;
    let creator = document.getElementById("creator").value;
    let video = document.getElementById("video").value;

    fetch(API + "/api/submitLevel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, id, creator, video })
    }).then(() => alert("Sent to admin!"));
}

function showNotifications() {
    let box = document.getElementById("notifications");
    if (!box) return;
    fetch(API + "/api/submissions")
    .then(r => r.json())
    .then(subs => {
        box.innerHTML = subs.length ? "" : "No pending levels";
        subs.forEach((lvl, i) => {
            box.innerHTML += `<div class="notification"><b>${lvl.name}</b><br><button onclick="approveLevel(${i})">Approve</button></div>`;
        });
    });
}

function approveLevel(index) {
    fetch(API + "/api/approveLevel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index })
    }).then(() => location.reload());
}

function getYoutubeThumbnail(url) {
    let id = "";
    if (url.includes("v=")) id = url.split("v=")[1].split("&")[0];
    else if (url.includes("youtu.be/")) id = url.split("youtu.be/")[1].split("?")[0];
    return "https://img.youtube.com/vi/" + id + "/hqdefault.jpg";
}

function loadLeaderboard() {
    let board = document.getElementById("leaderboard");
    if (!board) return;
    fetch(API + "/api/leaderboard")
    .then(r => r.json())
    .then(list => {
        board.innerHTML = list.length ? "" : "No levels yet";
        let admin = localStorage.getItem("admin");
        list.forEach((lvl, i) => {
            let adminBtns = (admin === "true") ? `<br><button onclick="moveUp(${i})">UP</button><button onclick="moveDown(${i})">DOWN</button><button onclick="deleteLevel(${i})">DEL</button>` : "";
            board.innerHTML += `<div class="level-card"><h3>#${i+1} - ${lvl.name}</h3><img src="${getYoutubeThumbnail(lvl.video)}" width="300"><br>Creator: ${lvl.creator}${adminBtns}</div>`;
        });
    });
}

function moveUp(index) { fetch(API + "/api/moveUp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ index }) }).then(() => location.reload()); }
function moveDown(index) { fetch(API + "/api/moveDown", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ index }) }).then(() => location.reload()); }
function deleteLevel(index) { fetch(API + "/api/deleteLevel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ index }) }).then(() => location.reload()); }
