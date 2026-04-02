// =======================
// LEVEL STORAGE
// =======================

let levels = JSON.parse(localStorage.getItem("levels")) || [];
let submissions = JSON.parse(localStorage.getItem("submissions")) || [];

const ADMIN_EMAIL = "maencopra@gmail.com";

// =======================
// YOUTUBE THUMBNAIL
// =======================

function getYouTubeID(url){
    let reg = /(?:youtube\.com.*v=|youtu\.be\/)([^&]+)/;
    let match = url.match(reg);
    return match ? match[1] : "";
}

// =======================
// LOAD LEADERBOARD
// =======================

function loadLeaderboard(){

    const list = document.getElementById("leaderboard");

    if(!list) return;

    list.innerHTML = "";

    levels.forEach((lvl,index)=>{

        let videoID = getYouTubeID(lvl.video);
        let thumb = `https://img.youtube.com/vi/${videoID}/mqdefault.jpg`;

        list.innerHTML += `
        <div class="level-card">

            <img src="${thumb}" class="level-thumb">

            <div class="level-info">
                <h3>#${index+1} ${lvl.name}</h3>
                <p>Creator: ${lvl.creator}</p>
                <a href="${lvl.video}" target="_blank">Watch</a>
            </div>

            ${adminButtons(index)}

        </div>
        `;
    });
}

// =======================
// ADMIN BUTTONS
// =======================

function adminButtons(index){

    let user = localStorage.getItem("loggedIn");

    if(user !== ADMIN_EMAIL) return "";

    return `
        <div class="admin-buttons">
            <button onclick="deleteLevel(${index})">Delete</button>
            <button onclick="replaceLevel(${index})">Replace</button>
        </div>
    `;
}

// =======================
// DELETE LEVEL
// =======================

function deleteLevel(index){

    levels.splice(index,1);

    localStorage.setItem("levels", JSON.stringify(levels));

    loadLeaderboard();
}

// =======================
// REPLACE LEVEL
// =======================

function replaceLevel(index){

    let name = prompt("New level name:");
    let video = prompt("New YouTube link:");

    if(!name || !video) return;

    levels[index] = {
        name:name,
        video:video,
        creator:"Admin"
    };

    localStorage.setItem("levels", JSON.stringify(levels));

    loadLeaderboard();
}

// =======================
// SUBMIT LEVEL
// =======================

function submitLevel(){

    let user = localStorage.getItem("loggedIn");

    if(!user){
        alert("You must login first!");
        return;
    }

    let name = document.getElementById("levelName").value;
    let video = document.getElementById("videoLink").value;

    if(!name || !video){
        alert("Fill everything!");
        return;
    }

    submissions.push({
        name:name,
        video:video,
        creator:user
    });

    localStorage.setItem("submissions", JSON.stringify(submissions));

    alert("Level sent to admin!");
}

// =======================
// ADMIN NOTIFICATIONS
// =======================

function loadSubmissions(){

    let user = localStorage.getItem("loggedIn");

    if(user !== ADMIN_EMAIL) return;

    let box = document.getElementById("adminSubmissions");

    if(!box) return;

    box.innerHTML = "";

    submissions.forEach((lvl,index)=>{

        box.innerHTML += `
        <div class="submission">
            <b>${lvl.name}</b> by ${lvl.creator}
            <button onclick="approveSubmission(${index})">
            Add level to leaderboard
            </button>
        </div>
        `;
    });

}

// =======================
// APPROVE LEVEL
// =======================

function approveSubmission(index){

    let lvl = submissions[index];

    levels.push(lvl);

    submissions.splice(index,1);

    localStorage.setItem("levels", JSON.stringify(levels));
    localStorage.setItem("submissions", JSON.stringify(submissions));

    loadLeaderboard();
    loadSubmissions();
}

// =======================
// LOAD PAGE
// =======================

window.addEventListener("load",()=>{

    loadLeaderboard();
    loadSubmissions();

});