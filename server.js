const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();

// ==========================================
// SUPABASE DATABASE CONNECTION
// ==========================================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Admin credentials from Vercel Environment Variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "maencopra@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "maenissocool";

// Middleware
app.use(cors());
app.use(bodyParser.json());

// ==========================================
// USER AUTHENTICATION (REGISTER & LOGIN)
// ==========================================

app.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const { data: existing } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
        if (existing) return res.json({ success: false, message: "Email already registered" });
        
        const { error } = await supabase.from("users").insert([{ username, email, password, score: 0 }]);
        if (error) throw error;
        res.json({ success: true, message: "Account created successfully" });
    } catch (err) {
        console.error("Register Error:", err.message);
        res.status(500).json({ success: false, message: "Database error" });
    }
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        return res.json({ success: true, username: "Admin", admin: true });
    }
    try {
        const { data: user, error } = await supabase.from("users").select("*").eq("email", email).eq("password", password).maybeSingle();
        if (error) throw error;
        if (user) {
            res.json({ success: true, username: user.username, admin: false });
        } else {
            res.json({ success: false, message: "Invalid email or password" });
        }
    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// ==========================================
// LEADERBOARD MANAGEMENT
// ==========================================

app.get("/leaderboard", async (req, res) => {
    try {
        const { data, error } = await supabase.from("leaderboard").select("*").order("position", { ascending: true });
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json([]);
    }
});

// ==========================================
// SUBMISSIONS & APPROVALS
// ==========================================

app.post("/submitLevel", async (req, res) => {
    const { name, id, creator, video } = req.body;
    try {
        const { error } = await supabase.from("submissions").insert([{ name, level_id: id, creator, video }]);
        if (error) throw error;
        res.json({ success: true, message: "Level sent to admin" });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

app.get("/submissions", async (req, res) => {
    try {
        const { data, error } = await supabase.from("submissions").select("*");
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.post("/approveLevel", async (req, res) => {
    const { index } = req.body;
    try {
        const { data: subs } = await supabase.from("submissions").select("*");
        if (!subs || !subs[index]) return res.json({ success: false });
        const lvl = subs[index];

        const { count } = await supabase.from("leaderboard").select('*', { count: 'exact', head: true });
        const newPos = (count || 0) + 1;

        await supabase.from("leaderboard").insert([{ name: lvl.name, level_id: lvl.level_id, creator: lvl.creator, video: lvl.video, position: newPos }]);
        await supabase.from("submissions").delete().eq("id", lvl.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// ==========================================
// RANKING CONTROLS (MOVE UP / MOVE DOWN)
// ==========================================

app.post("/moveUp", async (req, res) => {
    const { index } = req.body;
    try {
        const { data: list } = await supabase.from("leaderboard").select("*").order("position", { ascending: true });
        if (!list || index <= 0) return res.json({ success: false });

        const current = list[index];
        const prev = list[index - 1];

        await supabase.from("leaderboard").update({ position: prev.position }).eq("id", current.id);
        await supabase.from("leaderboard").update({ position: current.position }).eq("id", prev.id);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

app.post("/moveDown", async (req, res) => {
    const { index } = req.body;
    try {
        const { data: list } = await supabase.from("leaderboard").select("*").order("position", { ascending: true });
        if (!list || index >= list.length - 1) return res.json({ success: false });

        const current = list[index];
        const next = list[index + 1];

        await supabase.from("leaderboard").update({ position: next.position }).eq("id", current.id);
        await supabase.from("leaderboard").update({ position: current.position }).eq("id", next.id);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

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

// Export for Vercel
module.exports = app;
