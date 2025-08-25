import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

// Configuração do MySQL (usa a mesma que você já tem no projeto)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await req.json();
    const { date, description, amount, category, comment, account } = body;

    const [result] = await pool.query(
      `UPDATE money_transactions
       SET date = ?, description = ?, amount = ?, category = ?, comment = ?, account = ?
       WHERE transaction_id = ?`,
      [date, description, amount, category, comment, account, id]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar transação" }, { status: 500 });
  }
}
