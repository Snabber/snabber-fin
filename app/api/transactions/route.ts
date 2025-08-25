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
