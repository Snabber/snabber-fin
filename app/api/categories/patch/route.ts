// app/api/categories/patch/route.ts
import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { getCategoryIcon } from "../route";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// PATCH: Atualiza os ícones de todas as categorias de um usuário

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    // Busca todas as categorias do usuário
    const [rows] = await pool.query(
      `SELECT id, category FROM user_categories WHERE user_id = ?`,
      [userId]
    );

    const categories = rows as { id: number; category: string }[];

    // Atualiza cada categoria com iconUrl
    for (const cat of categories) {
      const iconUrl = (await getCategoryIcon(cat.category)) ?? "❓";

      await pool.query(
        `UPDATE user_categories SET icon_url = ? WHERE id = ?`,
        [iconUrl, cat.id]
      );
    }

    return NextResponse.json({
      message: `Icones atualizados para o usuário ${userId}`,
      updatedCount: categories.length,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
