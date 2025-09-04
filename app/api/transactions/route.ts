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

export async function GET(req: NextRequest) {
    try {
        const userId = req.nextUrl.searchParams.get("userId");
        const year = req.nextUrl.searchParams.get("year");
        const month = req.nextUrl.searchParams.get("month"); // opcional

        if (!userId) return NextResponse.json([]);

        let query = "SELECT * FROM money_transactions WHERE user_id = ?";
        const params: any[] = [userId];

        if (year) {
            query += " AND YEAR(date) = ?";
            params.push(year);
        } else {
            const currentYear = new Date().getFullYear().toString();
            query += " AND YEAR(date) = ?";
            params.push(currentYear);
        }
        if (month && month !== "Todos") {
            query += " AND MONTH(date) = ?";
            params.push(month);
        }

        query += " ORDER BY date DESC";

        const [rows] = await pool.query(query, params);
        return NextResponse.json(rows);
    } catch (err) {
        console.error(err);
        return NextResponse.json([]);
    }
}

export async function POST(req: NextRequest) {
  try {
    const { date, description, amount, category, comment, account, userId } = await req.json();

    if (!date || !description || !amount || !category || !userId) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    try {
      const [result] = await pool.query(
        "INSERT INTO money_transactions (date, description, amount, category, comment, account, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [date, description, amount, category, comment, account, userId]
      );

      // Retorna o registro criado
      const [rows] = await pool.query(
        "SELECT * FROM money_transactions WHERE transaction_id = ?",
        [(result as any).insertId]
      ) as [any[], any];

      return NextResponse.json(rows[0]);
    } catch (err: any) {
      if (err.code === "ER_DUP_ENTRY") {
        return NextResponse.json(
          {
            error: "Transação já existe! Experimente modificar data, comentário, valor ou descrição.",
            type: "duplicate",
          },
          { status: 409 }
        );
      }
      throw err;
    }

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

