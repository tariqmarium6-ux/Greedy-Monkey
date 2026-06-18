const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
// Serve static frontend files from this directory
app.use(express.static(__dirname));

// Initialize Databases
const globalDbPath = path.join(__dirname, 'global.db');
const personalDbPath = path.join(__dirname, 'personal.db');

const globalDb = new sqlite3.Database(globalDbPath, (err) => {
    if (err) console.error('Error opening global database:', err.message);
    else console.log('Connected to global SQLite database.');
});

const personalDb = new sqlite3.Database(personalDbPath, (err) => {
    if (err) console.error('Error opening personal database:', err.message);
    else console.log('Connected to personal SQLite database.');
});

// Setup Tables
globalDb.serialize(() => {
    globalDb.run(`
        CREATE TABLE IF NOT EXISTS leaderboard (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            score INTEGER NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

personalDb.serialize(() => {
    personalDb.run(`
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            score INTEGER NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

// Helper: Run db query with promises
const dbQuery = (db, query, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const dbRun = (db, query, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

// --- API Endpoints ---

// 1. Fetch Top 10 Global Leaderboard
app.get('/api/leaderboard', async (req, res) => {
    try {
        const rows = await dbQuery(
            globalDb, 
            'SELECT username, score, timestamp FROM leaderboard ORDER BY score DESC, timestamp ASC LIMIT 10'
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Fetch Personal Score History (for self-competition details)
app.get('/api/personal-history', async (req, res) => {
    try {
        const rows = await dbQuery(
            personalDb, 
            'SELECT score, timestamp FROM history ORDER BY timestamp DESC LIMIT 20'
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. Submit Score & Get Competition Metrics
app.post('/api/scores', async (req, res) => {
    const { username, score } = req.body;
    
    if (typeof username !== 'string' || typeof score !== 'number') {
        return res.status(400).json({ success: false, error: 'Invalid username or score' });
    }

    try {
        // Fetch previous personal performance BEFORE writing this new run
        const history = await dbQuery(personalDb, 'SELECT score FROM history');
        const pastScores = history.map(h => h.score);

        let isNewPersonalBest = false;
        let beatAverage = false;
        let pastBest = 0;
        let pastAverage = 0;
        let scoresBeaten = 0;

        if (pastScores.length > 0) {
            pastBest = Math.max(...pastScores);
            pastAverage = pastScores.reduce((a, b) => a + b, 0) / pastScores.length;
            isNewPersonalBest = score > pastBest;
            beatAverage = score > pastAverage;
            scoresBeaten = pastScores.filter(s => score > s).length;
        } else {
            // First game played
            isNewPersonalBest = true;
            beatAverage = true;
            pastBest = 0;
            pastAverage = 0;
            scoresBeaten = 0;
        }

        // Save new score to Global database
        await dbRun(globalDb, 'INSERT INTO leaderboard (username, score) VALUES (?, ?)', [username, score]);

        // Save new score to Personal database
        await dbRun(personalDb, 'INSERT INTO history (score) VALUES (?)', [score]);

        // Fetch new global rank for this player
        const rankRows = await dbQuery(
            globalDb,
            'SELECT COUNT(*) as rankCount FROM leaderboard WHERE score > ?',
            [score]
        );
        const globalRank = rankRows[0].rankCount + 1;

        // Fetch top 5 personal bests overall
        const personalBestsRows = await dbQuery(
            personalDb,
            'SELECT score, timestamp FROM history ORDER BY score DESC, timestamp ASC LIMIT 5'
        );

        res.json({
            success: true,
            metrics: {
                globalRank,
                isNewPersonalBest,
                beatAverage,
                pastBest,
                pastAverage: Math.round(pastAverage * 10) / 10,
                scoresBeaten,
                totalPastGames: pastScores.length
            },
            personalBests: personalBestsRows.map(row => row.score)
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Start Express Server
app.listen(PORT, () => {
    console.log(`Greedy Monkey backend running at http://localhost:${PORT}`);
});
