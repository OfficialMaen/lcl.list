// =======================
// EXPRESS SERVER WITH SUPABASE (VERCEL OPTIMIZED)
// =======================

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();

// ===========================
// SUPABASE SETUP
// ===========================
// These values MUST be set in Vercel Project Settings > Environment Variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("CRITICAL: Missing SUPABASE_URL or SUPABASE_KEY in Environment Variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Admin credentials (Set these in Vercel Environment Variables)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "maencopra@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "maenissocool12345";

// ===========================
// MIDDLEWARE (CORS FIX)
// ===========================
app.use(cors({
    origin: ["https://officialmaen.github.io", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
}));

app.use(bodyParser.json());
app.use(express.static(".")); 

// =======================
// ROUTES
// =======================

// 1. Register
app.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: "Fill all fields" });
    }

    try {
        const { data: existing } = await supabase
            .from("users")
            .select("id")
            .eq("email", email)
            .maybeSingle();

        if (existing) {
            return res.json({ success: false, message: "Email already exists" });
        }

        const { error } = await supabase
            .from("users")
            .insert([{ username, email, password, score: 0 }]);

        if (error) throw error;

        res.json({ success: true, message: "Account created" });
    } catch (err) {
        console.error("Register Error:", err.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 2. Login
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    // Check if admin
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        return res.json({ success: true, username: "Admin", admin: true });
    }

    try {
        const { data: user, error } = await supabase
            .from("users")
            .select("username, password")
            .eq("email", email)
            .maybeSingle();

        if (error) throw error;

        if (user && user.password === password) {
            res.json({ success: true, username: user.username, admin: false });
        } else {
            res.json({ success: false, message: "Wrong email or password" });
        }
    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 3. Get Leaderboard
app.get("/leaderboard", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("leaderboard")
            .select("*")
            .order("position", { ascending: true });

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error("Leaderboard Error:", err.message);
        res.status(500).json([]);
    }
});

// 4. Submit Level
app.post("/submitLevel", async (req, res) => {
    const { name, id, creator, video } = req.body;

    try {
        const { error } = await supabase
            .from("submissions")
            .insert([{ name, level_id: id, creator, video }]);

        if (error) throw error;
        res.json({ success: true, message: "Level submitted" });
    } catch (err) {
        console.error("Submit Error:", err.message);
        res.status(500).json({ success: false });
    }
});

// 5. Get Submissions (Admin Only)
app.get("/submissions", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("submissions")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error("Submissions Error:", err.message);
        res.status(500).json([]);
    }
});

// 6. Approve Level
app.post("/approveLevel", async (req, res) => {
    const { index } = req.body;

    try {
        const { data: subs } = await supabase.from("submissions").select("*").order("created_at", { ascending: false });
        
        if (!subs || !subs[index]) return res.json({ success: false });
        const level = subs[index];

        const { count } = await supabase.from("leaderboard").select('*', { count: 'exact', head: true });
        const newPos = (count || 0) + 1;

        await supabase.from("leaderboard").insert([{
            name: level.name,
            level_id: level.level_id,
            creator: level.creator,
            video: level.video,
            position: newPos
        }]);

        await supabase.from("submissions").delete().eq("id", level.id);

        res.json({ success: true });
    } catch (err) {
        console.error("Approve Error:", err.message);
        res.status(500).json({ success: false });
    }
});

// 7. Move Up
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

// 8. Move Down
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

// 9. Delete Level
app.post("/deleteLevel", async (req, res) => {
    const { index } = req.body;
    try {
        const { data: list } = await supabase.from("leaderboard").select("id").order("position", { ascending: true });
        if (!list || !list[index]) return res.json({ success: false });

        await supabase.from("leaderboard").delete().eq("id", list[index].id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// =======================
// EXPORT FOR VERCEL
// =======================
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Local server: http://localhost:${PORT}`));
}

module.exports = app;