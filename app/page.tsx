"use client";
import { useState } from "react";

export default function Home() {
    const [isCreating, setIsCreating] = useState(false);
    const [form, setForm] = useState({ user: "", password: "" });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem("userId", data.userId);
            window.location.href = "/dashboard";
        } else {
            setError("Usuário ou senha inválidos.");
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        if (res.ok) {
            setSuccess("Usuário criado com sucesso! Faça login.");
            setIsCreating(false);
            setForm({ user: "", password: "" });
        } else {
            setError("Erro ao criar usuário.");
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #7c2ea0 0%, #fbc02d 100%)"
        }}>
            <div style={{
                background: "white",
                padding: "2rem 2.5rem",
                borderRadius: "12px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
                minWidth: "320px",
                maxWidth: "90vw"
            }}>

                <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
                    <img src="/img/Logo_Principal.png" alt="Logo" style={{ alignSelf:"center", height: "60px" }} />
                </div>

                <h3 style={{ color: "#7c2ea0", textAlign: "center", marginBottom: "1.5rem" }}>
                    {isCreating ? "Criar Usuário" : "Login"}
                </h3>
                <form onSubmit={isCreating ? handleCreate : handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <input
                        type="text"
                        placeholder="Usuário"
                        value={form.user}
                        onChange={e => setForm({ ...form, user: e.target.value })}
                        required
                        style={{
                            padding: "0.7rem",
                            borderRadius: "6px",
                            border: "1px solid #ccc",
                            fontSize: "1rem"
                        }}
                    />
                    <input
                        type="password"
                        placeholder="Senha"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        required
                        style={{
                            padding: "0.7rem",
                            borderRadius: "6px",
                            border: "1px solid #ccc",
                            fontSize: "1rem"
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            background: "#7c2ea0",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            padding: "0.7rem",
                            fontWeight: "bold",
                            fontSize: "1rem",
                            cursor: "pointer"
                        }}
                    >
                        {isCreating ? "Criar Usuário" : "Entrar"}
                    </button>
                </form>
                {error && <div style={{ color: "#d32f2f", marginTop: "1rem", textAlign: "center" }}>{error}</div>}
                {success && <div style={{ color: "#388e3c", marginTop: "1rem", textAlign: "center" }}>{success}</div>}
                <div style={{ marginTop: "2rem", textAlign: "center" }}>
                    <button
                        onClick={() => {
                            setIsCreating(!isCreating);
                            setError("");
                            setSuccess("");
                        }}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#7c2ea0",
                            textDecoration: "underline",
                            cursor: "pointer",
                            fontSize: "0.95rem"
                        }}
                    >
                        {isCreating ? "Já tem conta? Entrar" : "Criar novo usuário"}
                    </button>
                </div>
            </div>
        </div>
    );
}
