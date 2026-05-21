import express from 'express';
import pg from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const { Pool } = pg;

// Configuração de conexão otimizada para Neon e Vercel
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Necessário para o Neon
  },
  max: 10, // Limite de conexões
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Teste de conexão ao iniciar
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('ERRO DE CONEXÃO COM O BANCO:', err.message);
  } else {
    console.log('CONECTADO AO NEON COM SUCESSO EM:', res.rows[0].now);
  }
});

// Endpoint para salvar/atualizar números
app.post('/sync', async (req, res) => {
  const { user_key, numbers } = req.body;

  if (!user_key || !Array.isArray(numbers)) {
    return res.status(400).json({ error: 'Dados inválidos: user_key ou numbers ausentes' });
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
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('ERRO NO SYNC:', err.message);
    res.status(500).json({ error: 'Erro no banco de dados', details: err.message });
  }
});

// Endpoint para buscar números atuais
app.get('/data/:user_key', async (req, res) => {
  const { user_key } = req.params;

  try {
    const result = await pool.query('SELECT numbers FROM roulette_data WHERE user_key = $1', [user_key]);
    if (result.rows.length === 0) {
      return res.json({ numbers: [] });
    }
    res.json({ numbers: result.rows[0].numbers });
  } catch (err) {
    console.error('ERRO NO GET DATA:', err.message);
    res.status(500).json({ error: 'Erro no banco de dados', details: err.message });
  }
});

// Rota de saúde para teste rápido
app.get('/', (req, res) => {
  res.send('Backend Padrão FIFA está Online!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
