const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

// Create connection pool for better connection management
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'tasks_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000
});

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database');
    connection.release();
  } catch (err) {
    console.error('Error connecting to MySQL:', err);
  }
}

testConnection();

app.post('/tasks', async (req, res) => {
  try {
    const { title, description } = req.body;
    const query = 'INSERT INTO tasks (title, description) VALUES (?, ?)';
    const [result] = await pool.execute(query, [title, description]);
    res.status(201).send({ id: result.insertId, title, description });
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).send({ error: 'Failed to create task' });
  }
});

app.get('/tasks', async (req, res) => {
  try {
    const query = 'SELECT * FROM tasks';
    const [results] = await pool.execute(query);
    res.json(results);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).send({ error: 'Failed to fetch tasks' });
  }
});

app.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'DELETE FROM tasks WHERE id = ?';
    await pool.execute(query, [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).send({ error: 'Failed to delete task' });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});