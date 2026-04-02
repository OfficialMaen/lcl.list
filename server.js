const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();

// ===========================
// SUPABASE SETUP
// ===========================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Admin credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "maencopra@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "maenissocool";

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, ".")));

// =======================
// HOME ROUTE (FIXES THE "CANNOT GET /" ERROR)
// =======================
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// =======================
// DATABASE ROUTES
// =======================

// Register
app.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const { data: existing } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
        if (existing) return res.json({ success: false, message: "Email already exists" });
        await supabase.from("users").insert([{ username, email, password, score: 0 }]);
        res.json({ success: true, message: "Account created" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// Login
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        return res.json({ success: true, username: "Admin", admin: true });
    }
    try {
        const { data: user } = await supabase.from("users").select("*").eq("email", email).eq("password", password).maybeSingle();
        if (user) {
            res.json({ success: true, username: user.username, admin: false });
        } else {
            res.json({ success: false, message: "Wrong email or password" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// Get Leaderboard
app.get("/leaderboard", async (req, res) => {
    try {
        const { data } = await supabase.from("leaderboard").select("*").order("position", { ascending: true });
        res.json(data || []);
    } catch (err) {
        res.json([]);
    }
});

// Submit Level
app.post("/submitLevel", async (req, res) => {
    const { name, id, creator, video } = req.body;
    try {
        await supabase.from("submissions").insert([{ name, level_id: id, creator, video }]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// Get Submissions (for admin)
app.get("/submissions", async (req, res) => {
    try {
        const { data } = await supabase.from("submissions").select("*");
        res.json(data || []);
    } catch (err) {
        res.json([]);
    }
});

// Approve Level
app.post("/approveLevel", async (req, res) => {
    const { index } = req.body;
    try {
        const { data: subs } = await supabase.from("submissions").select("*");
        if (!subs || !subs[index]) return res.json({ success: false });
        const level = subs[index];
        const { count } = await supabase.from("leaderboard").select('*', { count: 'exact', head: true });
        const newPos = (count || 0) + 1;
        await supabase.from("leaderboard").insert([{ name: level.name, level_id: level.level_id, creator: level.creator, video: level.video, position: newPos }]);
        await supabase.from("submissions").delete().eq("id", level.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// Delete Level
app.post("/deleteLevel", async (req, res) => {
    const { index } = req.body;
    try {
        const { data: list } = await supabase.from("leaderboard").select("id").order("position", { ascending: true });
        if (list && list[index]) {
            await supabase.from("leaderboard").delete().eq("id", list[index].id);
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// =======================
// EXPORT FOR VERCEL
// =======================
module.exports = app;
