const express = require("express");
const path = require("path");
const mysql = require("mysql2"); // 1. Importa o driver do MySQL que baixamos
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para processar JSON e servir arquivos estáticos da pasta 'public'
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// 2. Configuração da conexão com o Banco de Dados MySQL local
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "0000", // 👈 Sua senha inserida aqui
  database: "neto_barbearia",
});

// 3. Efetua a conexão com o banco de dados
db.connect((err) => {
  if (err) {
    console.error("❌ Erro ao conectar ao MySQL:", err);
    return;
  }
  console.log("✅ Conectado com sucesso ao banco MySQL (neto_barbearia)!");
});

// Endpoint para processar o agendamento salvando no MySQL
app.post("/api/agendar", (req, res) => {
  const { nome, telefone, servico, data, hora } = req.body;

  // Validação básica no backend
  if (!nome || !telefone || !servico || !data || !hora) {
    return res
      .status(400)
      .json({ success: false, error: "Todos os campos são obrigatórios." });
  }

  // 4. Query SQL substituindo o antigo array .push()
  const sql =
    "INSERT INTO agendamentos (nome, telefone, servico, data_agendamento, hora_agendamento) VALUES (?, ?, ?, ?, ?)";

  db.query(sql, [nome, telefone, servico, data, hora], (err, result) => {
    if (err) {
      console.error("Erro ao inserir no banco:", err);
      return res
        .status(500)
        .json({
          success: false,
          error: "Erro interno ao salvar no banco de dados.",
        });
    }

    // Formatação da mensagem para o WhatsApp do Neto
    const numeroWhats = "5511963198279";
    const mensagemTexto =
      `💈 *Novo Agendamento - Neto Cabeleireiro* 💈\n\n` +
      `👤 *Cliente:* ${nome}\n` +
      `📞 *Contato:* ${telefone}\n` +
      `✂️ *Serviço:* ${servico}\n` +
      `📅 *Data:* ${data}\n` +
      `⏰ *Horário:* ${hora}\n\n` +
      `_Confirmado via sistema web e salvo no MySQL._`;

    const urlWhatsapp = `https://api.whatsapp.com/send?phone=${numeroWhats}&text=${encodeURIComponent(mensagemTexto)}`;

    // Retorna sucesso e a URL que o frontend vai abrir
    return res.status(201).json({
      success: true,
      message: "Agendamento salvo com sucesso no MySQL!",
      whatsappUrl: urlWhatsapp,
    });
  });
});

// Endpoint extra alterado para buscar os agendamentos direto do banco de dados
app.get("/api/agendamentos", (req, res) => {
  db.query("SELECT * FROM agendamentos", (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor ativo em: http://localhost:${PORT}`);
});
