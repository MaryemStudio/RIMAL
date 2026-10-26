"use strict";

// RIMAL local backend: Express + SQLite + signed httpOnly admin cookie.
// This development server listens only on 127.0.0.1, not on the public network.

const express = require("express");
const Database = require("better-sqlite3");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = __dirname;
const ENV_PATH = path.join(ROOT, ".env");

function readEnvFile() {
    if (!fs.existsSync(ENV_PATH)) {
        const username = process.env.RIMAL_ADMIN_USER || "admin";
        const password = process.env.RIMAL_ADMIN_PASSWORD || crypto.randomBytes(12).toString("base64url");
        const sessionSecret = process.env.RIMAL_SESSION_SECRET || crypto.randomBytes(48).toString("hex");
        const port = process.env.PORT || "3000";
        const contents = [
            "# Local-only RIMAL credentials. Never upload this file to GitHub.",
            `RIMAL_ADMIN_USER=${username}`,
            `RIMAL_ADMIN_PASSWORD=${password}`,
            `RIMAL_SESSION_SECRET=${sessionSecret}`,
            `PORT=${port}`,
            ""
        ].join("\n");
        fs.writeFileSync(ENV_PATH, contents, { flag: "wx", mode: 0o600 });
        process.env.RIMAL_ADMIN_USER = username;
        process.env.RIMAL_ADMIN_PASSWORD = password;
        process.env.RIMAL_SESSION_SECRET = sessionSecret;
        process.env.PORT = port;
        console.log("\n====================================================");
        console.log(" RIMAL: first-run admin credentials");
        console.log(` Username: ${username}`);
        console.log(` Password: ${password}`);
        console.log(" Save this password. It is also stored in the local .env file.");
        console.log("====================================================\n");
        return;
    }

    const text = fs.readFileSync(ENV_PATH, "utf8");
    for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const index = trimmed.indexOf("=");
        if (index < 1) continue;
        const key = trimmed.slice(0, index).trim();
        const value = trimmed.slice(index + 1).trim();
        if (!(key in process.env)) process.env[key] = value;
    }
    process.env.RIMAL_ADMIN_USER ||= "admin";
    process.env.RIMAL_ADMIN_PASSWORD ||= crypto.randomBytes(12).toString("base64url");
    process.env.RIMAL_SESSION_SECRET ||= crypto.randomBytes(48).toString("hex");
    process.env.PORT ||= "3000";
}
readEnvFile();

const ADMIN_USER = process.env.RIMAL_ADMIN_USER;
const ADMIN_PASSWORD = process.env.RIMAL_ADMIN_PASSWORD;
const SESSION_SECRET = process.env.RIMAL_SESSION_SECRET;
const PORT = Number(process.env.PORT) || 3000;
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const COOKIE_NAME = "rimal_admin";

const dataDir = path.join(ROOT, "data");
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, "rimal.sqlite"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
    CREATE TABLE IF NOT EXISTS menu_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        price REAL NOT NULL CHECK(price >= 0),
        image TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reservations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL DEFAULT '',
        phone TEXT NOT NULL DEFAULT '',
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        guests INTEGER NOT NULL DEFAULT 2,
        occasion TEXT NOT NULL DEFAULT '',
        message TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'Pending',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL DEFAULT '',
        subject TEXT NOT NULL DEFAULT '',
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'New',
        created_at TEXT NOT NULL
    );
`);

const allowedCategories = new Set(["starters", "main", "chef", "desserts", "drinks", "hot"]);
function canonicalCategory(value) {
    const valueClean = String(value || "").trim().toLowerCase();
    const map = {
        mains: "main",
        "main-dishes": "main",
        "hot-drinks": "hot",
        hot_drinks: "hot"
    };
    const result = map[valueClean] || valueClean;
    return allowedCategories.has(result) ? result : "";
}
function cleanText(value, max = 500) {
    return String(value ?? "").trim().slice(0, max);
}


function parsePrice(value) {
    if (typeof value !== "number" && typeof value !== "string") {
        return NaN;
    }

    const input = String(value).trim();

    if (input === "" || !/^\d+(\.\d{1,2})?$/.test(input)) {
        return NaN;
    }

    const number = Number(input);

    return Number.isFinite(number) && number >= 0 && number <= 99999
        ? number
        : NaN;
}

function parsePrice(value) {
    if (typeof value !== "number" && typeof value !== "string") {
        return NaN;
    }

    const input = String(value).trim();

    if (input === "" || !/^\d+(\.\d{1,2})?$/.test(input)) {
        return NaN;
    }

    const number = Number(input);

    return Number.isFinite(number) && number >= 0 && number <= 99999
        ? number
        : NaN;
}


function isHttpUrl(value) {
    try {
        const url = new URL(String(value));
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}
function newId(prefix) {
    return `${prefix}-${crypto.randomUUID()}`;
}
function localDateKey() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
function menuRow(row) {
    return {
        id: row.id,
        name: row.name,
        category: row.category,
        description: row.description,
        price: Number(row.price),
        image: row.image,
        active: Boolean(row.is_active),
        position: row.position,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}
function reservationRow(row) {
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        date: row.date,
        time: row.time,
        guests: row.guests,
        occasion: row.occasion,
        message: row.message,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}
function messageRow(row) {
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        subject: row.subject,
        message: row.message,
        status: row.status,
        createdAt: row.created_at
    };
}
function getMenuSeedFromCurrentScript() {
    const scriptPath = path.join(ROOT, "script.js");
    if (!fs.existsSync(scriptPath)) return [];
    try {
        const source = fs.readFileSync(scriptPath, "utf8");
        const match = source.match(/const\s+menuItems\s*=\s*(\[[\s\S]*?\])\s*;/);
        if (!match) return [];
        const array = vm.runInNewContext(`(${match[1]})`, Object.create(null), { timeout: 1000 });
        if (!Array.isArray(array)) return [];
        return array.slice(0, 100).map(item => ({
            id: cleanText(item.id, 120) || newId("dish"),
            name: cleanText(item.name, 90),
            category: canonicalCategory(item.category),
            description: cleanText(item.description, 260),
            price: parsePrice(item.price),
            image: cleanText(item.image, 2000)
        })).filter(item => item.name && item.category && Number.isFinite(item.price) && isHttpUrl(item.image));
    } catch (error) {
        console.error("Could not read the current site's menu data for initial import:", error.message);
        return [];
    }
}

const countMenu = db.prepare("SELECT COUNT(*) AS count FROM menu_items");
const insertMenu = db.prepare(`INSERT INTO menu_items
    (id, name, category, description, price, image, is_active, position, created_at, updated_at)
    VALUES (@id, @name, @category, @description, @price, @image, 1, @position, @created_at, @updated_at)`);
const seedMenuTransaction = db.transaction(items => {
    const now = new Date().toISOString();
    items.forEach((item, index) => insertMenu.run({
        id: item.id || newId("dish"),
        name: item.name,
        category: item.category,
        description: item.description,
        price: item.price,
        image: item.image,
        position: index,
        created_at: now,
        updated_at: now
    }));
});

// If a previous installation has no menu, import the menu from the current browser
// the first time the public site opens. This preserves the user's current image URLs.
const app = express();
app.disable("x-powered-by");
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "DENY");
    next();
});
app.use(express.json({ limit: "300kb" }));

function safeEqual(left, right) {
    const a = Buffer.from(String(left));
    const b = Buffer.from(String(right));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function signPayload(payload) {
    return crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
}
function makeSessionToken() {
    const payload = Buffer.from(JSON.stringify({
        user: ADMIN_USER,
        expires: Date.now() + SESSION_TTL_SECONDS * 1000,
        nonce: crypto.randomBytes(12).toString("hex")
    })).toString("base64url");
    return `${payload}.${signPayload(payload)}`;
}
function getCookie(req, name) {
    const cookieHeader = req.headers.cookie || "";
    for (const part of cookieHeader.split(";")) {
        const separator = part.indexOf("=");
        if (separator < 0) continue;
        if (part.slice(0, separator).trim() === name) return decodeURIComponent(part.slice(separator + 1).trim());
    }
    return "";
}
function validSession(req) {
    const token = getCookie(req, COOKIE_NAME);
    const pieces = token.split(".");
    if (pieces.length !== 2) return false;
    const [payload, signature] = pieces;
    if (!safeEqual(signature, signPayload(payload))) return false;
    try {
        const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
        return session.user === ADMIN_USER && Number(session.expires) > Date.now();
    } catch {
        return false;
    }
}
function requireAdmin(req, res, next) {
    if (!validSession(req)) return res.status(401).json({ error: "Admin login required." });
    next();
}
function setSessionCookie(res, token) {
    res.setHeader("Set-Cookie", `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_SECONDS}`);
}
function clearSessionCookie(res) {
    res.setHeader("Set-Cookie", `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
}

const loginFailures = new Map();
app.get("/api/health", (req, res) => res.json({ ok: true, service: "RIMAL local backend", database: "SQLite" }));

app.post("/api/admin/login", (req, res) => {
    const ip = req.socket.remoteAddress || "local";
    const now = Date.now();
    const entry = loginFailures.get(ip) || { count: 0, startedAt: now, blockedUntil: 0 };
    if (entry.blockedUntil > now) return res.status(429).json({ error: "Too many login attempts. Wait 15 minutes and try again." });

    const username = cleanText(req.body?.username, 120);
    const password = String(req.body?.password || "");
    const valid = safeEqual(username, ADMIN_USER) && safeEqual(password, ADMIN_PASSWORD);
    if (!valid) {
        if (now - entry.startedAt > 15 * 60 * 1000) {
            entry.count = 0;
            entry.startedAt = now;
        }
        entry.count += 1;
        if (entry.count >= 8) entry.blockedUntil = now + 15 * 60 * 1000;
        loginFailures.set(ip, entry);
        return res.status(401).json({ error: "Incorrect username or password." });
    }

    loginFailures.delete(ip);
    setSessionCookie(res, makeSessionToken());
    return res.json({ ok: true, username: ADMIN_USER });
});
app.post("/api/admin/logout", (req, res) => {
    clearSessionCookie(res);
    res.json({ ok: true });
});
app.get("/api/admin/me", (req, res) => res.json({ authenticated: validSession(req), username: validSession(req) ? ADMIN_USER : null }));

app.get("/api/menu", (req, res) => {
    const category = req.query.category && req.query.category !== "all" ? canonicalCategory(req.query.category) : "";
    const rows = category
        ? db.prepare("SELECT * FROM menu_items WHERE is_active = 1 AND category = ? ORDER BY position, created_at").all(category)
        : db.prepare("SELECT * FROM menu_items WHERE is_active = 1 ORDER BY position, created_at").all();
    res.json(rows.map(menuRow));
});
app.post("/api/setup/seed", (req, res) => {
    if (countMenu.get().count > 0) return res.status(409).json({ error: "Menu has already been initialized." });
    if (!Array.isArray(req.body?.items) || req.body.items.length === 0) return res.status(400).json({ error: "No menu items were supplied." });
    const items = req.body.items.slice(0, 100).map(item => ({
        id: cleanText(item.id, 120) || newId("dish"),
        name: cleanText(item.name, 90),
        category: canonicalCategory(item.category),
        description: cleanText(item.description, 260),
        price: parsePrice(item.price),
        image: cleanText(item.image, 2000)
    })).filter(item => item.name && item.category && item.description && Number.isFinite(item.price) && isHttpUrl(item.image));
    if (!items.length) return res.status(400).json({ error: "No valid menu items found in the current website script." });
    seedMenuTransaction(items);
    res.status(201).json({ ok: true, imported: items.length });
});

app.post("/api/reservations", (req, res) => {
    const body = req.body || {};
    const name = cleanText(body.name, 120);
    const email = cleanText(body.email, 254);
    const phone = cleanText(body.phone, 50);
    const date = cleanText(body.date, 10);
    const time = cleanText(body.time, 10);
    const guests = Number(body.guests || 2);
    const occasion = cleanText(body.occasion, 100);
    const message = cleanText(body.specialRequest ?? body.message, 1000);
    const today = localDateKey();
    if (!name || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today || !/^\d{2}:\d{2}$/.test(time) || !Number.isInteger(guests) || guests < 1 || guests > 30) {
        return res.status(400).json({ error: "Please provide a name, a future or current date, a valid time, and between 1 and 30 guests." });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Please provide a valid email address." });
    const id = newId("reservation");
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO reservations (id, name, email, phone, date, time, guests, occasion, message, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)`)
        .run(id, name, email, phone, date, time, guests, occasion, message, now, now);
    res.status(201).json({ ok: true, reservation: reservationRow(db.prepare("SELECT * FROM reservations WHERE id = ?").get(id)) });
});

app.post("/api/messages", (req, res) => {
    const body = req.body || {};
    const name = cleanText(body.name, 120);
    const email = cleanText(body.email, 254);
    const subject = cleanText(body.subject, 180);
    const message = cleanText(body.message, 3000);
    if (!name || !message || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
        return res.status(400).json({ error: "Please provide a name, message, and valid email if supplied." });
    }
    const id = newId("message");
    const createdAt = new Date().toISOString();
    db.prepare("INSERT INTO messages (id, name, email, subject, message, status, created_at) VALUES (?, ?, ?, ?, ?, 'New', ?)")
        .run(id, name, email, subject, message, createdAt);
    res.status(201).json({ ok: true, id });
});

app.get("/api/admin/menu", requireAdmin, (req, res) => {
    const rows = db.prepare("SELECT * FROM menu_items ORDER BY position, created_at").all();
    res.json(rows.map(menuRow));
});
app.post("/api/admin/menu", requireAdmin, (req, res) => {
    const body = req.body || {};
    const item = {
        id: newId("dish"),
        name: cleanText(body.name, 90),
        category: canonicalCategory(body.category),
        description: cleanText(body.description, 260),
        price: parsePrice(body.price),
        image: cleanText(body.image, 2000)
    };
    if (!item.name || !item.category || !item.description || !Number.isFinite(item.price) || !isHttpUrl(item.image)) return res.status(400).json({ error: "Check the name, category, description, price, and image URL." });
    const now = new Date().toISOString();
    const position = db.prepare("SELECT COALESCE(MAX(position), -1) + 1 AS next FROM menu_items").get().next;
    insertMenu.run({ ...item, position, created_at: now, updated_at: now });
    res.status(201).json(menuRow(db.prepare("SELECT * FROM menu_items WHERE id = ?").get(item.id)));
});
app.put("/api/admin/menu/:id", requireAdmin, (req, res) => {
    const existing = db.prepare("SELECT * FROM menu_items WHERE id = ?").get(req.params.id);
    if (!existing) return res.status(404).json({ error: "Dish not found." });
    const body = req.body || {};
    const item = {
        name: cleanText(body.name, 90),
        category: canonicalCategory(body.category),
        description: cleanText(body.description, 260),
        price: parsePrice(body.price),
        image: cleanText(body.image, 2000),
        active: body.active === undefined ? Boolean(existing.is_active) : body.active !== false
    };
    if (!item.name || !item.category || !item.description || !Number.isFinite(item.price) || !isHttpUrl(item.image)) return res.status(400).json({ error: "Check the name, category, description, price, and image URL." });
    db.prepare("UPDATE menu_items SET name = ?, category = ?, description = ?, price = ?, image = ?, is_active = ?, updated_at = ? WHERE id = ?")
        .run(item.name, item.category, item.description, item.price, item.image, item.active ? 1 : 0, new Date().toISOString(), req.params.id);
    res.json(menuRow(db.prepare("SELECT * FROM menu_items WHERE id = ?").get(req.params.id)));
});
app.delete("/api/admin/menu/:id", requireAdmin, (req, res) => {
    const result = db.prepare("DELETE FROM menu_items WHERE id = ?").run(req.params.id);
    if (!result.changes) return res.status(404).json({ error: "Dish not found." });
    res.json({ ok: true });
});

app.get("/api/admin/reservations", requireAdmin, (req, res) => {
    res.json(db.prepare("SELECT * FROM reservations ORDER BY created_at DESC").all().map(reservationRow));
});
app.patch("/api/admin/reservations/:id", requireAdmin, (req, res) => {
    const status = cleanText(req.body?.status, 20);
    if (!["Pending", "Confirmed", "Cancelled"].includes(status)) return res.status(400).json({ error: "Unsupported reservation status." });
    const result = db.prepare("UPDATE reservations SET status = ?, updated_at = ? WHERE id = ?").run(status, new Date().toISOString(), req.params.id);
    if (!result.changes) return res.status(404).json({ error: "Reservation not found." });
    res.json(reservationRow(db.prepare("SELECT * FROM reservations WHERE id = ?").get(req.params.id)));
});
app.delete("/api/admin/reservations/:id", requireAdmin, (req, res) => {
    const result = db.prepare("DELETE FROM reservations WHERE id = ?").run(req.params.id);
    if (!result.changes) return res.status(404).json({ error: "Reservation not found." });
    res.json({ ok: true });
});

app.get("/api/admin/messages", requireAdmin, (req, res) => {
    res.json(db.prepare("SELECT * FROM messages ORDER BY created_at DESC").all().map(messageRow));
});
app.delete("/api/admin/messages/:id", requireAdmin, (req, res) => {
    const result = db.prepare("DELETE FROM messages WHERE id = ?").run(req.params.id);
    if (!result.changes) return res.status(404).json({ error: "Message not found." });
    res.json({ ok: true });
});

// Do not make secrets, the SQLite folder, dependencies, or server code downloadable.
app.use((req, res, next) => {
    const requestPath = decodeURIComponent((req.path || "").toLowerCase());
    if (requestPath.startsWith("/node_modules/") || requestPath.startsWith("/data/") ||
        ["/server.js", "/package.json", "/package-lock.json", "/.env"].includes(requestPath)) {
        return res.sendStatus(404);
    }
    next();
});

// Inject the API bridge into the user's current index.html at request time;
// no manual HTML/CSS redesign is needed.
app.get(["/", "/index.html"], (req, res) => {
    const indexPath = path.join(ROOT, "index.html");
    if (!fs.existsSync(indexPath)) return res.status(404).send("index.html was not found in the RIMAL project folder.");
    let html = fs.readFileSync(indexPath, "utf8");
    if (!html.includes("/backend-bridge.js")) {
        const bridge = '<script src="/backend-bridge.js"></script>\n';
        if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, `${bridge}</body>`);
        else html += bridge;
    }
    res.setHeader("Cache-Control", "no-store");
    res.type("html").send(html);
});

app.use(express.static(ROOT, { index: false, dotfiles: "deny", extensions: ["html"] }));
app.use("/api", (req, res) => res.status(404).json({ error: "API route not found." }));
app.use((err, req, res, next) => {
    console.error("RIMAL server error:", err.message);
    if (res.headersSent) return next(err);
    res.status(500).json({ error: "Unexpected server error. Check the Terminal for details." });
});

const server = app.listen(PORT, "127.0.0.1", () => {
    console.log(`RIMAL backend is running at http://127.0.0.1:${PORT}`);
    console.log(`Public website: http://127.0.0.1:${PORT}/`);
    console.log(`Admin dashboard: http://127.0.0.1:${PORT}/admin.html`);
    console.log(`Admin username: ${ADMIN_USER}`);
    console.log("Admin password is stored in the local .env file.");
    console.log("Local SQLite database: data/rimal.sqlite");
    console.log("Press Ctrl+C to stop the server.\n");
});

function shutdown() {
    try { db.close(); } catch { }
    server.close(() => process.exit(0));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);