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
    "SELECT DISTINCT account FROM money_transactions WHERE user_id = ? AND account IS NOT NULL AND account != ''",
    [userId]
  );
  const accounts = (rows as Array<{ account: string }>).map((r) => r.account);
  return NextResponse.json({ accounts });
}