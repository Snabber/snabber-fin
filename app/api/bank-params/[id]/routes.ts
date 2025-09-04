// api/bank-params/[id]/route.ts
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

// GET -> retorna um registro pelo ID
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM bank_parse_params WHERE id = ?",
            [params.id]
        );

        if (!Array.isArray(rows) || rows.length === 0) {
            return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });
        }

        return NextResponse.json(rows[0]);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}

// PUT -> atualiza um registro pelo ID
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const keys = Object.keys(body);

        if (keys.length === 0) {
            return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
        }

        const setClause = keys.map((key) => `${key} = ?`).join(", ");
        const values = keys.map((key) => body[key]);

        await pool.query(
            `UPDATE bank_parse_params SET ${setClause} WHERE id = ?`,
            [...values, params.id]
        );

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}

// DELETE -> remove registro pelo ID
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await pool.query("DELETE FROM bank_parse_params WHERE id = ?", [params.id]);
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
