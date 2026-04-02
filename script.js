// In production (Vercel), API calls should be relative to the deployed origin.
const API = window.location.origin;

// =======================
// MENU FUNCTIONS
// =======================

function openMenu(){
    document.getElementById("sidebar").style.left="0";
}

function closeMenu(){
    document.getElementById("sidebar").style.left="-260px";
}

// =======================
// REGISTER
// =======================

function register(){
    let username = document.getElementById("username").value;
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    if(!username || !email || !password){
        alert("Fill all fields");
        return;
    }

    fetch(API + "/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username, email, password})
    })
    .then(r => r.json())
    .then(data => {
        if(data.success){
            localStorage.setItem("email", email);
            alert("Account created! Please login.");
            window.location = "login.html";
        } else {
            alert(data.message || "Registration failed");
        }
    })
    .catch(err => {
        console.error("Registration error:", err);
        alert("Server error. Check Vercel logs.");
    });
}

// =======================
// LOGIN
// =======================

function login(){
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    fetch(API + "/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email, password})
    })
    .then(r => r.json())
    .then(data => {
        if(data.success){
            localStorage.setItem("logged", "true");
            localStorage.setItem("username", data.username);
            localStorage.setItem("admin", data.admin ? "true" : "false");
            localStorage.setItem("email", email);
            alert("Logged in successfully!");
            window.location = "index.html";
        } else {
            alert(data.message || "Wrong email or password");
        }
    })
    .catch(err => {
        console.error("Login error:", err);
    });
}

// =======================
// LOGOUT
// =======================

function logout(){
    localStorage.clear();
    alert("Logged out");
    window.location = "login.html";
}

// =======================
// PAGE LOAD
// =======================

window.onload = function(){
    let logged = localStorage.getItem("logged");
    let username = localStorage.getItem("username");
    let admin = localStorage.getItem("admin");

    let userText = document.getElementById("userText");

    if(userText){
        if(logged === "true"){
            userText.innerText = "Logged in as: " + username;
        } else {
            userText.innerText = "Not logged in";
        }
    }

    if(admin === "true"){
        showAdminPanel();
        showNotifications();
    }

    loadLeaderboard();
};

// =======================
// SEND LEVEL
// =======================

function sendLevel(){
    let logged = localStorage.getItem("logged");

    if(logged !== "true"){
        alert("You must login first");
        return;
    }

    let name = document.getElementById("levelname").value;
    let id = document.getElementById("levelid").value;
    let creator = document.getElementById("creator").value;
    let video = document.getElementById("video").value;

    if(!name || !id || !creator || !video){
        alert("Fill all fields");
        return;
    }

    fetch(API + "/submitLevel", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({name, id, creator, video})
    })
    .then(r => r.json())
    .then(data => {
        if(data.success){
            alert("Level sent to admin!");
        }
    })
    .catch(err => console.error("Submit error:", err));
}

// =======================
// ADMIN FUNCTIONS
// =======================

function showAdminPanel(){
    let panel = document.getElementById("adminPanel");
    if(panel) panel.style.display = "block";
}

function showNotifications(){
    let box = document.getElementById("notifications");
    if(!box) return;

    fetch(API + "/submissions")
    .then(r => r.json())
    .then(submissions => {
        box.innerHTML = "";
        if(!submissions.length) {
            box.innerHTML = "No pending levels";
            return;
        }
        submissions.forEach((lvl, i) => {
            let div = document.createElement("div");
            div.className = "notification";
            div.innerHTML = `
            <b>${lvl.name}</b> (ID: ${lvl.level_id})<br>
            <button onclick="approveLevel(${i})">Approve</button>
            `;
            box.appendChild(div);
        });
    });
}

function approveLevel(index){
    fetch(API + "/approveLevel", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({index})
    }).then(() => location.reload());
}

// =======================
// GET YOUTUBE THUMBNAIL (FIXED)
// =======================

function getYoutubeThumbnail(url){
    let id = "";
    if(url.includes("v=")){
        id = url.split("v=")[1].split("&")[0];
    } else if (url.includes("youtu.be/")) {
        id = url.split("youtu.be/")[1].split("?")[0];
    }
    return "https://img.youtube.com/vi/" + id + "/hqdefault.jpg";
}

// =======================
// LOAD LEADERBOARD
// =======================

function loadLeaderboard(){
    let board = document.getElementById("leaderboard");
    if(!board) return;

    fetch(API + "/leaderboard")
    .then(r => r.json())
    .then(leaderboard => {
        board.innerHTML = "";
        leaderboard.forEach((lvl, i) => {
            let thumb = getYoutubeThumbnail(lvl.video);
            let div = document.createElement("div");
            div.className = "level-card";
            div.innerHTML = `
            <h3>#${i+1} - ${lvl.name}</h3>
            <img src="${thumb}" width="300"><br>
            Creator: ${lvl.creator}<br>
            <a href="${lvl.video}" target="_blank">Watch</a>
            `;
            board.appendChild(div);
        });
    });
}

// =======================
// ADMIN CONTROLS
// =======================
function deleteLevel(index){
    fetch(API + "/deleteLevel", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({index})
    }).then(() => location.reload());
}
