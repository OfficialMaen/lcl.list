const API = window.location.origin;

function openMenu() { document.getElementById("sidebar").style.left = "0"; }
function closeMenu() { document.getElementById("sidebar").style.left = "-260px"; }

function register() {
    let u = document.getElementById("username").value, e = document.getElementById("email").value, p = document.getElementById("password").value;
    if(!u || !e || !p) return alert("Fill all fields");
    fetch(API + "/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: u, email: e, password: p }) })
    .then(r => r.json()).then(d => { if (d.success) { alert("Created!"); window.location = "login.html"; } else alert("Failed: " + d.message); });
}

function login() {
    let e = document.getElementById("email").value, p = document.getElementById("password").value;
    fetch(API + "/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: e, password: p }) })
    .then(r => r.json()).then(d => {
        if (d.success) {
            localStorage.setItem("logged", "true"); localStorage.setItem("username", d.username); localStorage.setItem("admin", d.admin ? "true" : "false");
            alert("Logged in!"); window.location = "index.html";
        } else alert("Wrong email or password");
    });
}

window.onload = function() {
    loadLeaderboard();
    if (localStorage.getItem("admin") === "true") { 
        let panel = document.getElementById("adminPanel");
        if(panel) panel.style.display = "block";
        showNotifications(); 
    }
    let ut = document.getElementById("userText");
    if (ut && localStorage.getItem("logged") === "true") ut.innerText = "Logged in as: " + localStorage.getItem("username");
};

function getYoutubeThumbnail(url) {
    let id = "";
    if (url.includes("v=")) id = url.split("v=")[1].split("&")[0];
    else if (url.includes("youtu.be/")) id = url.split("youtu.be/")[1].split("?")[0];
    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

function loadLeaderboard() {
    let board = document.getElementById("leaderboard");
    if(!board) return;
    fetch(API + "/api/leaderboard").then(r => r.json()).then(list => {
        board.innerHTML = list.length ? "" : "No levels yet";
        list.forEach((lvl, i) => {
            let admin = (localStorage.getItem("admin") === "true") ? `<br><button onclick="moveUp(${i})">UP</button><button onclick="moveDown(${i})">DOWN</button><button onclick="deleteLevel(${i})">DEL</button>` : "";
            board.innerHTML += `<div class="level-card"><h3>#${i+1} ${lvl.name}</h3><img src="${getYoutubeThumbnail(lvl.video)}" width="300"><br>Creator: ${lvl.creator}${admin}</div>`;
        });
    });
}

function showNotifications() {
    let box = document.getElementById("notifications");
    if(!box) return;
    fetch(API + "/api/submissions").then(r => r.json()).then(subs => {
        box.innerHTML = subs.length ? "" : "No pending levels";
        subs.forEach((lvl, i) => { box.innerHTML += `<div class="notification"><b>${lvl.name}</b><br><button onclick="approveLevel(${i})">Approve</button></div>`; });
    });
}

function moveUp(i) { fetch(API + "/api/moveUp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ index: i }) }).then(() => location.reload()); }
function moveDown(i) { fetch(API + "/api/moveDown", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ index: i }) }).then(() => location.reload()); }
function approveLevel(i) { fetch(API + "/api/approveLevel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ index: i }) }).then(() => location.reload()); }
function deleteLevel(i) { fetch(API + "/api/deleteLevel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ index: i }) }).then(() => location.reload()); }
function sendLevel() {
    let n = document.getElementById("levelname").value, id = document.getElementById("levelid").value, c = document.getElementById("creator").value, v = document.getElementById("video").value;
    if(!n || !id || !c || !v) return alert("Fill all fields");
    fetch(API + "/api/submitLevel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: n, id: id, creator: c, video: v }) }).then(() => alert("Sent to Admin!"));
}
function logout() { localStorage.clear(); window.location = "index.html"; }
