// app/api/transactions/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

// Configuração do MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export async function POST(req: NextRequest) {
  try {
    const { transactionIds }: { transactionIds: number[] } = await req.json();

    if (!transactionIds || transactionIds.length === 0) {
      return NextResponse.json({ error: "Nenhuma transação selecionada" }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      const placeholders = transactionIds.map(() => "?").join(",");
      const sql = `DELETE FROM money_transactions WHERE transaction_id IN (${placeholders})`;
      await connection.query(sql, transactionIds);
    } finally {
      connection.release();
    }

    return NextResponse.json({ message: "Transações removidas com sucesso" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao deletar transações" }, { status: 500 });
  }
}
