import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { date, description, amount, category, comment, account, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });
    }

    // 1️⃣ Verifica categoria
    if (category?.trim()) {
      const [rows] = await pool.query(
        `SELECT id FROM user_categories WHERE user_id = ? AND category = ?`,
        [userId, category]
      );
      if ((rows as any[]).length === 0) {
        await pool.query(
          `INSERT INTO user_categories (user_id, category) VALUES (?, ?)`,
          [userId, category]
        );
      }
    }

    // 2️⃣ Tenta atualizar a transação
    try {
      await pool.query(
        `UPDATE money_transactions
         SET date = ?, description = ?, amount = ?, category = ?, comment = ?, account = ?
         WHERE transaction_id = ?`,
        [date, description, amount, category, comment, account, id]
      );
    } catch (err: any) {
      // 3️⃣ Lida com duplicidade
      if (err.code === "ER_DUP_ENTRY") {
        return NextResponse.json(
          {
            error:
              "Transação já existe! Experimente modificar a data, comentário, valor ou descrição.",
            type: "duplicate",
          },
          { status: 409 }
        );
      }
      throw err;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Erro ao atualizar transação" },
      { status: 500 }
    );
  }
}
