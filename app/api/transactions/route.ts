import mysql from "mysql2/promise";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return new Response(JSON.stringify({ error: "userId não fornecido" }), { status: 400 });
  }

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT),
    });

    const [rows] = await connection.execute(
      "SELECT * FROM money_transactions WHERE user_id = ? ORDER BY date DESC",
      [userId]
    );

    await connection.end();

    return new Response(JSON.stringify(rows), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Erro ao buscar transações" }), { status: 500 });
  }
}

// === Adicionar POST ===
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, description, amount, category, comment, account, userId } = body;

    if (!userId || !date || !description || !amount) {
      return new Response(JSON.stringify({ error: "Dados incompletos" }), { status: 400 });
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT),
    });

    const [result] = await connection.execute(
      `INSERT INTO money_transactions (date, description, amount, category, comment, account, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [date, description, amount, category || "", comment || "", account || "", userId]
    );

    const transactionId = (result as any).insertId;

    await connection.end();

    // Retorna a transação criada
    return new Response(
      JSON.stringify({ transaction_id: transactionId, date, description, amount, category, comment, account }),
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Erro ao adicionar transação" }), { status: 500 });
  }
}
