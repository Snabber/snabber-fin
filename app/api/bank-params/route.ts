// api/bank-params/route.ts
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

// GET -> lista todos os registros
export async function GET() {
    try {
        const [rows] = await pool.query("SELECT * FROM bank_parse_params");
        return NextResponse.json(rows);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}

// POST -> cria novo registro
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            colDate,
            colDesc,
            colValSpent,
            colValEarned,
            colComment,
            source,
            removeDots = false,
            startRow = 10,
            changeSignal = true,
            colCategory = "To be Defined",
        } = body;

        // Checagem de campos obrigatórios (0 é válido)
        if (
            colDate == null ||
            colDesc == null ||
            colValSpent == null ||
            colValEarned == null ||
            colComment == null ||
            !source
        ) {
            return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
        }

        // Inserção no banco
        const [result] = await pool.query(
            `INSERT INTO bank_parse_params 
             (colDate, colDesc, colValSpent, colValEarned, colComment, source, removeDots, startRow, changeSignal, colCategory)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                colDate,
                colDesc,
                colValSpent,
                colValEarned,
                colComment,
                source,
                removeDots ? 1 : 0,
                startRow,
                changeSignal ? 1 : 0,
                colCategory
            ]
        );

        // Retorna o registro inserido com o ID gerado
        const insertedId = (result as any).insertId;
        return NextResponse.json({ id: insertedId, ...body });

    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}

// PUT -> atualiza registro (espera body com id)
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, ...fields } = body;

        if (!id) {
            return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
        }

        const keys = Object.keys(fields);
        if (keys.length === 0) {
            return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
        }

        const setClause = keys.map((key) => `${key} = ?`).join(", ");
        const values = keys.map((key) => fields[key]);

        await pool.query(
            `UPDATE bank_parse_params SET ${setClause} WHERE id = ?`,
            [...values, id]
        );

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}

// DELETE -> remove registro (espera query param ?id=)
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
        }

        await pool.query("DELETE FROM bank_parse_params WHERE id = ?", [id]);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
