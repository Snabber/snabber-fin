import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function POST(req: Request) {
  try {
    const { transactionIds, category } = await req.json();
    if (!transactionIds?.length) return NextResponse.json({ error: "Nenhuma transação selecionada" }, { status: 400 });

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

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
