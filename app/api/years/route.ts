import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

// Use a mesma configuração de conexão das outras rotas
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
        if (!userId) return NextResponse.json({ years: [] });
        const [rows] = await pool.query(
            "SELECT DISTINCT YEAR(date) as year FROM money_transactions WHERE user_id = ? ORDER BY year DESC",
            [userId]
        );
        const years = (rows as Array<{ year: number }>).map((r) => r.year.toString());
        return NextResponse.json({ years });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ years: [] });
    }
}