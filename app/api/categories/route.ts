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
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });

  const [rows] = await pool.query(
    "SELECT DISTINCT category FROM money_transactions WHERE user_id = ? AND category IS NOT NULL AND category != ''",
    [userId]
  );
  const categories = (rows as Array<{ category: string }>).map((r) => r.category);
  return NextResponse.json({ categories });
}