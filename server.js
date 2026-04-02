const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();

// ===========================
// SUPABASE SETUP
// ===========================
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "maencopra@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "maenissocool";

// Middleware
app.use(cors());
app.use(bodyParser.json());

// 1. FORCES the server to serve your CSS and JS files so it doesn't look like 1998
app.use(express.static(path.join(__dirname, ".")));

// =======================
// PAGE ROUTES
// =======================

// 2. FORCES the server to show index.html when you visit the main link
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// 3. Automatically handles other pages like login.html or send.html
app.get("/:page", (req, res, next) => {
    const page = req.params.page;
    if (page.endsWith(".html") || page.includes(".")) {
        res.sendFile(path.join(__dirname, page), (err) => {
            if (err) next(); // If file doesn't exist, try API routes
        });
    } else {
        next();
    }
});

// =======================
// DATABASE API ROUTES
// =======================

app.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const { data: existing } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
        if (existing) return res.json({ success: false, message: "Email exists" });
        await supabase.from("users").insert([{ username, email, password }]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) return res.json({ success: true, username: "Admin", admin: true });
    try {
        const { data: user } = await supabase.from("users").select("*").eq("email", email).eq("password", password).maybeSingle();
        if (user) res.json({ success: true, username: user.username, admin: false });
        else res.json({ success: false, message: "Invalid login" });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.get("/leaderboard", async (req, res) => {
    const { data } = await supabase.from("leaderboard").select("*").order("position", { ascending: true });
    res.json(data || []);
});

app.post("/submitLevel", async (req, res) => {
    const { name, id, creator, video } = req.body;
    await supabase.from("submissions").insert([{ name, level_id: id, creator, video }]);
    res.json({ success: true });
});

app.get("/submissions", async (req, res) => {
    const { data } = await supabase.from("submissions").select("*");
    res.json(data || []);
});

app.post("/approveLevel", async (req, res) => {
    const { index } = req.body;
    const { data: subs } = await supabase.from("submissions").select("*");
    if (!subs || !subs[index]) return res.json({ success: false });
    const lvl = subs[index];
    const { count } = await supabase.from("leaderboard").select('*', { count: 'exact', head: true });
    await supabase.from("leaderboard").insert([{ name: lvl.name, level_id: lvl.level_id, creator: lvl.creator, video: lvl.video, position: (count || 0) + 1 }]);
    await supabase.from("submissions").delete().eq("id", lvl.id);
    res.json({ success: true });
});

app.post("/deleteLevel", async (req, res) => {
    const { index } = req.body;
    const { data: list } = await supabase.from("leaderboard").select("id").order("position", { ascending: true });
    if (list[index]) await supabase.from("leaderboard").delete().eq("id", list[index].id);
    res.json({ success: true });
});

module.exports = app;
