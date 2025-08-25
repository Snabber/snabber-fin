import mysql from "mysql2/promise";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Campos incompletos" }), { status: 400 });
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT),
    });

    const [rows] = await connection.execute(
      "SELECT id, password FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    await connection.end();

    if (!rows || (rows as any).length === 0) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado" }), { status: 404 });
    }

    const user = (rows as any)[0];

    // Para produção, use bcrypt.compare() ao invés de comparação direta
    if (password !== user.password) {
      return new Response(JSON.stringify({ error: "Senha incorreta" + password + user.password }), { status: 401 });
    }

    return new Response(JSON.stringify({ userId: user.id }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Erro ao fazer login" }), { status: 500 });
  }
}
