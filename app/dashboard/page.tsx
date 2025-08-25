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
    <div className="p-8">
      <h1 className="text-3xl font-bold text-[var(--color-purple)] mb-4">Dashboard</h1>
      <button
        className="mb-4 bg-[var(--color-purple)] text-white px-4 py-2 rounded hover:bg-[var(--color-orange)]"
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? "Fechar" : "Adicionar Transação"}
      </button>

      {showForm && (
        <form onSubmit={handleAddTransaction} className="mb-6 bg-white p-4 rounded shadow-md flex flex-col gap-2 w-[400px]">
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          <input type="text" placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <input type="number" placeholder="Valor" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <input type="text" placeholder="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input type="text" placeholder="Comentário" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
          <input type="text" placeholder="Conta" value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} />
          <button className="bg-[var(--color-purple)] text-white px-2 py-1 rounded hover:bg-[var(--color-orange)]" type="submit">Adicionar</button>
        </form>
      )}

      <div className="mb-4 flex items-center gap-2">
        <button onClick={selectAll} className="px-2 py-1 bg-gray-300 rounded">Selecionar Todos</button>
        <button onClick={deselectAll} className="px-2 py-1 bg-gray-300 rounded">Desmarcar Todos</button>
        <input
          type="text"
          placeholder="Categoria em massa"
          value={bulkCategory}
          onChange={(e) => setBulkCategory(e.target.value)}
          className="px-2 py-1 border rounded"
        />
        <button onClick={handleBulkCategoryChange} className="px-2 py-1 bg-[var(--color-purple)] text-white rounded hover:bg-[var(--color-orange)]">
          Atualizar Categoria
        </button>
      </div>

      <table className="w-full border border-gray-300 bg-white rounded shadow">
        <thead className="bg-[var(--color-light)]">
          <tr>
            <th className="border px-2 py-1">Sel.</th>
            <th className="border px-2 py-1">Data</th>
            <th className="border px-2 py-1">Descrição</th>
            <th className="border px-2 py-1">Valor</th>
            <th className="border px-2 py-1">Categoria</th>
            <th className="border px-2 py-1">Comentário</th>
            <th className="border px-2 py-1">Conta</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.transaction_id}>
              <td className="border px-2 py-1 text-center">
                <input
                  type="checkbox"
                  checked={selectedTransactions.includes(t.transaction_id)}
                  onChange={() => toggleSelect(t.transaction_id)}
                />
              </td>
              <td className="border px-2 py-1">{t.date}</td>
              <td className="border px-2 py-1">{t.description}</td>
              <td className="border px-2 py-1">{t.amount}</td>
              <td className="border px-2 py-1">{t.category}</td>
              <td className="border px-2 py-1">{t.comment}</td>
              <td className="border px-2 py-1">{t.account}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
