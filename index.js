import express from 'express';
import pg from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// CORS ultra-permissivo para garantir que a extensão consiga conectar
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Endpoint para salvar/atualizar números
app.post('/sync', async (req, res) => {
  console.log('REQUISIÇÃO RECEBIDA NO SYNC:', req.body);
  const { user_key, numbers } = req.body;

  if (!user_key || !Array.isArray(numbers)) {
    console.error('DADOS INVÁLIDOS:', req.body);
    return res.status(400).json({ error: 'Dados inválidos' });
  }

  try {
    const query = `
      INSERT INTO roulette_data (user_key, numbers, last_updated)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (user_key)
      DO UPDATE SET 
        numbers = $2,
        last_updated = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const result = await pool.query(query, [user_key, JSON.stringify(numbers)]);
    console.log('GRAVADO COM SUCESSO:', user_key);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('ERRO NO BANCO:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/data/:user_key', async (req, res) => {
  const { user_key } = req.params;
  try {
    const result = await pool.query('SELECT numbers FROM roulette_data WHERE user_key = $1', [user_key]);
    res.json({ numbers: result.rows.length > 0 ? result.rows[0].numbers : [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('Backend Padrão FIFA Online'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Porta ${PORT}`));
