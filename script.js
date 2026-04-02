// In production (Vercel), API calls should be relative to the deployed origin.
// Admin credentials must be server-side only, not in client scripts.
// Example: Change this to your real link from Vercel
const API = "https://vercel.com/new/import?framework=other&hasTrialAvailable=0&id=1199636267&name=LCL.level-challenge-list-&owner=OfficialMaen&project-name=lcl-level-challenge-list&provider=github&remainingProjects=1&s=https%3A%2F%2Fgithub.com%2FOfficialMaen%2FLCL.level-challenge-list-&teamSlug=official-lcl&totalProjects=1";

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
        alert("Server error. Make sure server is running on port 3000");
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
        alert("Server error. Make sure server is running on port 3000");
    });
}

// =======================
// LOGOUT
// =======================

function logout(){
    localStorage.removeItem("logged");
    localStorage.removeItem("username");
    localStorage.removeItem("admin");
    localStorage.removeItem("email");
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
            document.getElementById("levelname").value = "";
            document.getElementById("levelid").value = "";
            document.getElementById("creator").value = "";
            document.getElementById("video").value = "";
        }
    })
    .catch(err => {
        console.error("Submit error:", err);
        alert("Failed to submit level");
    });
}

// =======================
// SHOW ADMIN PANEL
// =======================

function showAdminPanel(){
    let panel = document.getElementById("adminPanel");
    if(panel) panel.style.display = "block";
}

// =======================
// SHOW ADMIN NOTIFICATIONS
// =======================

function showNotifications(){
    let box = document.getElementById("notifications");
    if(!box) return;

    box.innerHTML = "<p>Loading submissions...</p>";

    fetch(API + "/submissions")
    .then(r => r.json())
    .then(submissions => {
        box.innerHTML = "";

        if(!Array.isArray(submissions) || submissions.length === 0){
            box.innerHTML = "<p>No pending submissions</p>";
            return;
        }

        submissions.forEach((lvl, i) => {
            let div = document.createElement("div");
            div.className = "notification";
            div.innerHTML = `
            <b>${lvl.name}</b><br>
            ID: ${lvl.id}<br>
            Creator: ${lvl.creator}<br>
            <a href="${lvl.video}" target="_blank">Watch</a>
            <br><br>
            <button onclick="approveLevel(${i})">Add Level to Leaderboard</button>
            `;
            box.appendChild(div);
        });
    })
    .catch(err => {
        console.error("Notifications error:", err);
        box.innerHTML = "<p>Error loading submissions</p>";
    });
}

function approveLevel(index){
    fetch(API + "/approveLevel", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({index})
    })
    .then(r => r.json())
    .then(data => {
        if(data.success){
            alert("Level added to leaderboard!");
            location.reload();
        }
    })
    .catch(err => console.error("Approve error:", err));
}

// =======================
// GET YOUTUBE THUMBNAIL
// =======================

function getYoutubeThumbnail(url){
    let id = "";
    
    if(url.includes("watch?v=")){
        id = url.split("watch?v=")[1];
    }
    
    if(id.includes("&")){
        id = id.split("&")[0];
    }
    return "https://img.youtube.com/vi/" + id + "/hqdefault.jpg";
}

// =======================
// LOAD LEADERBOARD
// =======================

function loadLeaderboard(){
    let board = document.getElementById("leaderboard");
    if(!board) return;

    board.innerHTML = "<p>Loading leaderboard...</p>";

    fetch(API + "/leaderboard")
    .then(r => r.json())
    .then(leaderboard => {
        board.innerHTML = "";
        
        if(leaderboard.length === 0){
            board.innerHTML = "<p>No levels yet!</p>";
            return;
        }

        let admin = localStorage.getItem("admin");

        leaderboard.forEach((lvl, i) => {
            let thumb = getYoutubeThumbnail(lvl.video);
            let div = document.createElement("div");
            div.className = "level-card";

            let adminButtons = "";

            if(admin === "true"){
                adminButtons = `
                <br>
                <button onclick="moveUp(${i})">⬆️</button>
                <button onclick="moveDown(${i})">⬇️</button>
                <button onclick="deleteLevel(${i})">🗑️ Delete</button>
                `;
            }

            div.innerHTML = `
            <h3>Top ${i+1} - ${lvl.name}</h3>
            <img src="${thumb}" width="300"><br>
            ID: ${lvl.id}<br>
            Creator: ${lvl.creator}<br>
            <a href="${lvl.video}" target="_blank">Watch on YouTube</a>
            ${adminButtons}
            `;

            board.appendChild(div);
        });

        window.currentLeaderboard = leaderboard;
    })
    .catch(err => {
        console.error("Error loading leaderboard:", err);
        board.innerHTML = "<p>Error loading leaderboard</p>";
    });
}

// =======================
function moveUp(index){
    fetch(API + "/moveUp", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({index})
    })
    .then(r => r.json())
    .then(data => {
        if(data.success){
            location.reload();
        }
    })
    .catch(err => console.error("Move up error:", err));
}

function moveDown(index){
    fetch(API + "/moveDown", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({index})
    })
    .then(r => r.json())
    .then(data => {
        if(data.success){
            location.reload();
        }
    })
    .catch(err => console.error("Move down error:", err));
}

function deleteLevel(index){
    if(confirm("Are you sure you want to delete this level?")){
        fetch(API + "/deleteLevel", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({index})
        })
        .then(r => r.json())
        .then(data => {
            if(data.success){
                alert("Level deleted");
                location.reload();
            }
        })
        .catch(err => console.error("Delete error:", err));
    }
}

// =======================
// END OF SCRIPT
// =======================