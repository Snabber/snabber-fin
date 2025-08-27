"use server";
import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import type { UserCategory } from "../../types/user_category";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// GET: Pega categorias de um usuário
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });

  const [rows] = await pool.query(
    `SELECT id, category, monthly_limit, icon_url
     FROM user_categories
     WHERE user_id = ?
     ORDER BY category`,
    [userId]
  );

  const categories: UserCategory[] = (rows as any[]).map((r) => ({
    id: r.id,
    category: r.category,
    monthlyLimit: r.monthly_limit,
    iconUrl: r.icon_url,
  }));

  return NextResponse.json({ categories });
}

// POST: Insere nova categoria
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, category, monthlyLimit, iconUrl } = body;

  if (!userId || !category) {
    return NextResponse.json(
      { error: "userId e category são obrigatórios" },
      { status: 400 }
    );
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO user_categories (user_id, category, monthly_limit, icon_url)
       VALUES (?, ?, ?, ?)`,
      [userId, category, monthlyLimit ?? null, iconUrl ?? null]
    );

    const insertedId = (result as any).insertId;

    const newCategory: UserCategory = {
      id: insertedId,
      category,
      monthlyLimit: monthlyLimit ?? null,
      iconUrl: iconUrl ?? null,
    };

    return NextResponse.json({ category: newCategory });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Atualiza categoria existente
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, category, monthlyLimit, iconUrl } = body;

  if (!id || !category) {
    return NextResponse.json(
      { error: "id e category são obrigatórios" },
      { status: 400 }
    );
  }

  try {
    await pool.query(
      `UPDATE user_categories
       SET category = ?, monthly_limit = ?, icon_url = ?
       WHERE id = ?`,
      [category, monthlyLimit ?? null, iconUrl ?? null, id]
    );

    const updatedCategory: UserCategory = {
      id,
      category,
      monthlyLimit: monthlyLimit ?? null,
      iconUrl: iconUrl ?? null,
    };

    return NextResponse.json({ category: updatedCategory });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


// DELETE: Remove categoria se não estiver em uso

export async function DELETE(req: NextRequest) {
  const categoryId = req.nextUrl.searchParams.get("id");
  const userId = req.nextUrl.searchParams.get("userId");
  if (!categoryId || !userId)
    return NextResponse.json(
      { error: "id da categoria e userId são obrigatórios" },
      { status: 400 }
    );

  try {
    // Pega o nome da categoria pelo id
    const [catRows] = await pool.query(
      `SELECT category FROM user_categories WHERE id = ? AND user_id = ?`,
      [categoryId, userId]
    );

    if ((catRows as any).length === 0) {
      return NextResponse.json(
        { error: "Categoria não encontrada para este usuário." },
        { status: 404 }
      );
    }

    const categoryName = (catRows as any)[0].category;

    // Verifica se existem transações usando essa categoria
    const [usageRows] = await pool.query(
      `SELECT COUNT(*) as count
       FROM money_transactions
       WHERE user_id = ? AND category = ?`,
      [userId, categoryName]
    );

    const usageCount = (usageRows as any)[0].count;

    if (usageCount > 0) {
      return NextResponse.json(
        { error: "Não é possível deletar. Categoria está em uso nas transações." },
        { status: 400 }
      );
    }

    // Remove a categoria
    await pool.query(
      `DELETE FROM user_categories WHERE id = ? AND user_id = ?`,
      [categoryId, userId]
    );

    return NextResponse.json({ message: "Categoria removida com sucesso." });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
