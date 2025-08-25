"use client";
import { useState, useEffect } from "react";

type Transaction = {
  transaction_id: number;
  date: string;
  description: string;
  amount: number;
  category: string;
  comment: string;
  account: string;
};

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
  const [form, setForm] = useState({
    date: "",
    description: "",
    amount: "",
    category: "",
    comment: "",
    account: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [bulkCategory, setBulkCategory] = useState("");

  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : 1;

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/transactions?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => setTransactions(data))
      .catch((err) => console.error(err));
  }, [userId]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, userId }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const newTransaction = await res.json();
      setTransactions((prev) => [newTransaction, ...prev]);
      setForm({ date: "", description: "", amount: "", category: "", comment: "", account: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Erro ao adicionar transação", err);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedTransactions((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedTransactions(transactions.map((t) => t.transaction_id));
  const deselectAll = () => setSelectedTransactions([]);

  const handleBulkCategoryChange = async () => {
    if (!bulkCategory || selectedTransactions.length === 0) return;
    try {
      const res = await fetch("/api/transactions/update-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionIds: selectedTransactions, category: bulkCategory }),
      });
      if (!res.ok) throw new Error("Erro na atualização em massa");
      // Atualiza localmente
      setTransactions((prev) =>
        prev.map((t) =>
          selectedTransactions.includes(t.transaction_id)
            ? { ...t, category: bulkCategory }
            : t
        )
      );
      setSelectedTransactions([]);
      setBulkCategory("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "'Museo Sans', sans-serif", background: "#f5f5f5" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#7c2ea0", marginBottom: "1rem" }}>
        Dashboard
      </h1>

      <button
        style={{
          marginBottom: "1rem",
          backgroundColor: "#7c2ea0",
          color: "#fff",
          padding: "0.6rem 1.2rem",
          borderRadius: "6px",
          cursor: "pointer",
          border: "none",
          fontWeight: "bold",
        }}
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? "Fechar" : "Adicionar Transação"}
      </button>

      {showForm && (
        <form
          onSubmit={handleAddTransaction}
          style={{
            marginBottom: "1.5rem",
            backgroundColor: "#fff",
            padding: "1rem",
            borderRadius: "8px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            maxWidth: "420px",
          }}
        >
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          <input type="text" placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <input type="number" placeholder="Valor" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <input type="text" placeholder="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input type="text" placeholder="Comentário" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
          <input type="text" placeholder="Conta" value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} />
          <button type="submit" style={{ backgroundColor: "#7c2ea0", color: "#fff", padding: "0.4rem 0.8rem", borderRadius: "4px", cursor: "pointer", border: "none", fontWeight: "bold" }}>
            Adicionar
          </button>
        </form>
      )}

      <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <button onClick={selectAll} style={{ padding: "0.4rem 0.8rem", backgroundColor: "#ccc", borderRadius: "4px", cursor: "pointer", border: "none" }}>Selecionar Todos</button>
        <button onClick={deselectAll} style={{ padding: "0.4rem 0.8rem", backgroundColor: "#ccc", borderRadius: "4px", cursor: "pointer", border: "none" }}>Desmarcar Todos</button>
        <input
          type="text"
          placeholder="Categoria em massa"
          value={bulkCategory}
          onChange={(e) => setBulkCategory(e.target.value)}
          style={{ padding: "0.4rem", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <button onClick={handleBulkCategoryChange} style={{ padding: "0.4rem 0.8rem", backgroundColor: "#7c2ea0", color: "#fff", borderRadius: "4px", cursor: "pointer", border: "none", fontWeight: "bold" }}>
          Atualizar Categoria
        </button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#fff", borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
        <thead style={{ backgroundColor: "#eaeaea" }}>
          <tr>
            <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>Sel.</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>Data</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>Descrição</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>Valor</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>Categoria</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>Comentário</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>Conta</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t, idx) => (
            <tr key={t.transaction_id} style={{ backgroundColor: idx % 2 === 0 ? "#f9f9f9" : "#fff" }}>
              <td style={{ textAlign: "center", padding: "0.5rem", borderBottom: "1px solid #ddd" }}>
                <input type="checkbox" checked={selectedTransactions.includes(t.transaction_id)} onChange={() => toggleSelect(t.transaction_id)} />
              </td>
                <td style={{ padding: "0.5rem", borderBottom: "1px solid #ddd" }}>{t.date}</td>
              <td style={{ padding: "0.5rem", borderBottom: "1px solid #ddd" }}>{t.description}</td>
              <td style={{ padding: "0.5rem", borderBottom: "1px solid #ddd" }}>{t.amount}</td>
              <td style={{ padding: "0.5rem", borderBottom: "1px solid #ddd" }}>{t.category}</td>
              <td style={{ padding: "0.5rem", borderBottom: "1px solid #ddd" }}>{t.comment}</td>
              <td style={{ padding: "0.5rem", borderBottom: "1px solid #ddd" }}>{t.account}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
