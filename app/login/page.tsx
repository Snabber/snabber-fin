"use client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      const data = await res.json();
      localStorage.setItem("userId", data.userId);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Erro no login");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-[var(--color-light)]">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-[320px]">
        <h1 className="text-[var(--color-purple)] text-2xl font-bold mb-4 text-center">Login</h1>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3"
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-3"
          required
        />
        <button
          type="submit"
          className="w-full bg-[var(--color-purple)] text-white py-2 mt-2 hover:bg-[var(--color-orange)]"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
