import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function POST(req: Request) {
  try {
    const { userId, transactionIds, category } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });
    if (!transactionIds?.length) return NextResponse.json({ error: "Nenhuma transação selecionada" }, { status: 400 });

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // 1️⃣ Verifica se a categoria já existe para o usuário
    const [rows] = await connection.execute(
      `SELECT id FROM user_categories WHERE user_id = ? AND category = ?`,
      [userId, category]
    );

    if ((rows as any[]).length === 0) {
      // Insere a categoria se não existir
      await connection.execute(
        `INSERT INTO user_categories (user_id, category) VALUES (?, ?)`,
        [userId, category]
      );
    }

    // 2️⃣ Atualiza as transações
    const placeholders = transactionIds.map(() => "?").join(",");
    await connection.execute(
      `UPDATE money_transactions SET category = ? WHERE transaction_id IN (${placeholders})`,
      [category, ...transactionIds]
    );

    await connection.end();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro na atualização em massa" }, { status: 500 });
  }
}
