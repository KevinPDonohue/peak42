const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'peak42';
const COLLECTION = 'state';
const DOC_ID = 'default';

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not set');
  process.exit(1);
}

let db;

async function connect() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);
  console.log('Connected to MongoDB');
}

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname)));

// GET /api/state — return saved state or empty object
app.get('/api/state', async (req, res) => {
  try {
    const doc = await db.collection(COLLECTION).findOne({ _id: DOC_ID });
    res.json(doc ? doc.state : {});
  } catch (err) {
    console.error('GET /api/state error:', err);
    res.status(500).json({ error: 'Failed to load state' });
  }
});

// POST /api/state — upsert full state
app.post('/api/state', async (req, res) => {
  try {
    await db.collection(COLLECTION).updateOne(
      { _id: DOC_ID },
      { $set: { state: req.body, updatedAt: new Date() } },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/state error:', err);
    res.status(500).json({ error: 'Failed to save state' });
  }
});

// Catch-all: serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

connect().then(() => {
  app.listen(PORT, () => console.log(`Peak42 running on port ${PORT}`));
}).catch(err => {
  console.error('MongoDB connection failed:', err);
  process.exit(1);
});
