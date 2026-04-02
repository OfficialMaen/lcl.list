const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "maencopra@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "maenissocool";

app.use(cors());
app.use(bodyParser.json());

// --- AUTHENTICATION ---
app.post("/api/register", async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const { data: existing } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
        if (existing) return res.json({ success: false, message: "Email already registered" });
        const { error } = await supabase.from("users").insert([{ username, email, password, score: 0 }]);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) return res.json({ success: true, username: "Admin", admin: true });
    try {
        const { data: user } = await supabase.from("users").select("*").eq("email", email).eq("password", password).maybeSingle();
        if (user) res.json({ success: true, username: user.username, admin: false });
        else res.json({ success: false });
    } catch (err) { res.status(500).json({ success: false }); }
});

// --- LEADERBOARD & RANKING (MOVE UP / MOVE DOWN) ---
app.get("/api/leaderboard", async (req, res) => {
    try {
        const { data } = await supabase.from("leaderboard").select("*").order("position", { ascending: true });
        res.json(data || []);
    } catch (err) { res.status(500).json([]); }
});

app.post("/api/moveUp", async (req, res) => {
    const { index } = req.body;
    try {
        const { data: list } = await supabase.from("leaderboard").select("*").order("position", { ascending: true });
        if (!list || index <= 0) return res.json({ success: false });
        const current = list[index], prev = list[index - 1];
        await supabase.from("leaderboard").update({ position: prev.position }).eq("id", current.id);
        await supabase.from("leaderboard").update({ position: current.position }).eq("id", prev.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.post("/api/moveDown", async (req, res) => {
    const { index } = req.body;
    try {
        const { data: list } = await supabase.from("leaderboard").select("*").order("position", { ascending: true });
        if (!list || index >= list.length - 1) return res.json({ success: false });
        const current = list[index], next = list[index + 1];
        await supabase.from("leaderboard").update({ position: next.position }).eq("id", current.id);
        await supabase.from("leaderboard").update({ position: current.position }).eq("id", next.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

// --- ADMIN & SUBMISSIONS ---
app.post("/api/submitLevel", async (req, res) => {
    const { name, id, creator, video } = req.body;
    try {
        await supabase.from("submissions").insert([{ name, level_id: id, creator, video }]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.get("/api/submissions", async (req, res) => {
    try {
        const { data } = await supabase.from("submissions").select("*");
        res.json(data || []);
    } catch (err) { res.status(500).json([]); }
});

app.post("/api/approveLevel", async (req, res) => {
    const { index } = req.body;
    try {
        const { data: subs } = await supabase.from("submissions").select("*");
        if (!subs || !subs[index]) return res.json({ success: false });
        const lvl = subs[index];
        const { count } = await supabase.from("leaderboard").select('*', { count: 'exact', head: true });
        await supabase.from("leaderboard").insert([{ name: lvl.name, level_id: lvl.level_id, creator: lvl.creator, video: lvl.video, position: (count || 0) + 1 }]);
        await supabase.from("submissions").delete().eq("id", lvl.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.post("/api/deleteLevel", async (req, res) => {
    const { index } = req.body;
    try {
        const { data: list } = await supabase.from("leaderboard").select("id").order("position", { ascending: true });
        if (list[index]) await supabase.from("leaderboard").delete().eq("id", list[index].id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

module.exports = app;
