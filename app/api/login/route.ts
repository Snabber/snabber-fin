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

export async function POST(req: NextRequest) {
    try {
        const { user, password } = await req.json();
        if (!user || !password) {
            return NextResponse.json({ error: "Usuário e senha obrigatórios" }, { status: 400 });
        }
        const [rows] = await pool.query(
            "SELECT id FROM users WHERE email = ? AND password = ?",
            [user, password]
        );
        if (Array.isArray(rows) && rows.length > 0) {
            return NextResponse.json({ userId: (rows as any)[0].id });
        } else {
            return NextResponse.json({ error: "Usuário ou senha inválidos" }, { status: 400 });
        }
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
