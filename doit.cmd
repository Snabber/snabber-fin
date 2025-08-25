@echo off
REM Cria pasta app/api/transactions se não existir
mkdir app\api\transactions 2>nul

REM Homepage
echo export default function Home() { > app\page.tsx
echo     return ( >> app\page.tsx
echo         ^<div^> >> app\page.tsx
echo             ^<h1^>Finance Dashboard^</h1^> >> app\page.tsx
echo             ^<a href="/login"^>Login^</a^> >> app\page.tsx
echo         ^</div^> >> app\page.tsx
echo     ); >> app\page.tsx
echo } >> app\page.tsx

REM Login page
mkdir app\login 2>nul
echo "use client"; > app\login\page.tsx
echo import { useState } from "react"; >> app\login\page.tsx
echo import { useRouter } from "next/navigation"; >> app\login\page.tsx
echo export default function Login(){ >> app\login\page.tsx
echo const [email,setEmail]=useState(""); >> app\login\page.tsx
echo const [password,setPassword]=useState(""); >> app\login\page.tsx
echo const router = useRouter(); >> app\login\page.tsx
echo const handleLogin=(e)=>{ >> app\login\page.tsx
echo e.preventDefault(); >> app\login\page.tsx
echo localStorage.setItem("userId","1"); >> app\login\page.tsx
echo router.push("/dashboard"); >> app\login\page.tsx
echo }; >> app\login\page.tsx
echo return (^ <form onSubmit={handleLogin}>^ >> app\login\page.tsx
echo ^<input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/^> >> app\login\page.tsx
echo ^<input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)}/^> >> app\login\page.tsx
echo ^<button type="submit"^>Login^</button^> >> app\login\page.tsx
echo ^</form^> ); >> app\login\page.tsx
echo } >> app\login\page.tsx

REM Logout page
mkdir app\logout 2>nul
echo "use client"; > app\logout\page.tsx
echo import { useEffect } from "react"; >> app\logout\page.tsx
echo import { useRouter } from "next/navigation"; >> app\logout\page.tsx
echo export default function Logout(){ >> app\logout\page.tsx
echo const router = useRouter(); >> app\logout\page.tsx
echo useEffect(()=>{ >> app\logout\page.tsx
echo localStorage.removeItem("userId"); >> app\logout\page.tsx
echo router.push("/login"); >> app\logout\page.tsx
echo },[]); >> app\logout\page.tsx
echo return ^<p^>Logging out...^</p^>; >> app\logout\page.tsx
echo } >> app\logout\page.tsx

REM Dashboard page
mkdir app\dashboard 2>nul
echo "use client"; > app\dashboard\page.tsx
echo import { useEffect, useState } from "react"; >> app\dashboard\page.tsx
echo import Link from "next/link"; >> app\dashboard\page.tsx
echo export default function Dashboard(){ >> app\dashboard\page.tsx
echo const [transactions,setTransactions]=useState([]); >> app\dashboard\page.tsx
echo const userId=localStorage.getItem("userId"); >> app\dashboard\page.tsx
echo useEffect(()=>{ >> app\dashboard\page.tsx
echo if(!userId){window.location.href="/login"; return;} >> app\dashboard\page.tsx
echo fetch(`/api/transactions?userId=${userId}`) >> app\dashboard\page.tsx
echo .then(res=>res.json()) >> app\dashboard\page.tsx
echo .then(data=>setTransactions(data)); >> app\dashboard\page.tsx
echo },[]); >> app\dashboard\page.tsx
echo return (^ <div>^ >> app\dashboard\page.tsx
echo ^<h1^>Dashboard^</h1^> >> app\dashboard\page.tsx
echo ^<Link href="/logout"^>Logout^</Link^> >> app\dashboard\page.tsx
echo ^<table border="1"^> >> app\dashboard\page.tsx
echo ^<thead^>^<tr^>^<th^>ID^</th^>^<th^>Data^</th^>^<th^>Descrição^</th^>^<th^>Valor^</th^>^<th^>Categoria^</th^>^<th^>Comentário^</th^>^<th^>Conta^</th^>^</tr^>^</thead^> >> app\dashboard\page.tsx
echo ^<tbody^>{transactions.map(t=>(^ <tr key={t.transaction_id}>^ <td>{t.transaction_id}</td> <td>{t.date}</td> <td>{t.description}</td> <td>{t.amount}</td> <td>{t.category}</td> <td>{t.comment}</td> <td>{t.account}</td> </tr>^ ))}</tbody^> >> app\dashboard\page.tsx
echo ^</table^>^</div^> ); >> app\dashboard\page.tsx
echo } >> app\dashboard\page.tsx

REM API route
echo import { NextRequest, NextResponse } from "next/server"; > app\api\transactions\route.ts
echo import mysql from "mysql2/promise"; >> app\api\transactions\route.ts
echo export async function GET(req: NextRequest){ >> app\api\transactions\route.ts
echo const { searchParams } = new URL(req.url); >> app\api\transactions\route.ts
echo const userId = searchParams.get("userId"); >> app\api\transactions\route.ts
echo const connection = await mysql.createConnection({ >> app\api\transactions\route.ts
echo host: process.env.DB_HOST, >> app\api\transactions\route.ts
echo user: process.env.DB_USER, >> app\api\transactions\route.ts
echo password: process.env.DB_PASSWORD, >> app\api\transactions\route.ts
echo database: process.env.DB_NAME, >> app\api\transactions\route.ts
echo port: Number(process.env.DB_PORT) >> app\api\transactions\route.ts
echo }); >> app\api\transactions\route.ts
echo try { >> app\api\transactions\route.ts
echo const [rows] = await connection.execute('SELECT * FROM money_transactions WHERE user_id = ? ORDER BY date DESC',[userId]); >> app\api\transactions\route.ts
echo return NextResponse.json(rows); >> app\api\transactions\route.ts
echo } catch(err){ >> app\api\transactions\route.ts
echo return NextResponse.json({error:"Erro ao buscar transações"},{status:500}); >> app\api\transactions\route.ts
echo } finally { >> app\api\transactions\route.ts
echo await connection.end(); >> app\api\transactions\route.ts
echo } >> app\api\transactions\route.ts
echo } >> app\api\transactions\route.ts

echo Todos os arquivos foram criados na estrutura app/ com sucesso!
pause
