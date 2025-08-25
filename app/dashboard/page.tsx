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
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
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
  const [filterText, setFilterText] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : "1";

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/transactions?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setTransactions(data);
        setFilteredTransactions(data);
      })
      .catch((err) => console.error(err));
  }, [userId]);

  // Filtra transações baseado no input de texto
  useEffect(() => {
    const filtered = transactions.filter(
      (t) =>
        t.description.toLowerCase().includes(filterText.toLowerCase()) ||
        t.category.toLowerCase().includes(filterText.toLowerCase()) ||
        t.comment.toLowerCase().includes(filterText.toLowerCase()) ||
        t.account.toLowerCase().includes(filterText.toLowerCase())
    );
    setFilteredTransactions(filtered);

    // Marca somente as linhas visíveis
    setSelectedTransactions((prevSelected) =>
      prevSelected.filter((id) => filtered.some((t) => t.transaction_id === id))
    );
  }, [filterText, transactions]);

  const handleAddOrEditTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await fetch(`/api/transactions/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, amount: Number(form.amount), userId }),
        });
        if (!res.ok) throw new Error(`Erro ao editar: ${res.status}`);
        setTransactions((prev) =>
          prev.map((t) =>
            t.transaction_id === editingId
              ? { ...t, ...form, amount: Number(form.amount) }
              : t
          )
        );
        setEditingId(null);
      } else {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, amount: Number(form.amount), userId }),
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const newTransaction = await res.json();
        setTransactions((prev) => [newTransaction, ...prev]);
      }
      setForm({ date: "", description: "", amount: "", category: "", comment: "", account: "" });
      setShowForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (transaction: Transaction) => {
    setForm({
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount.toString(),
      category: transaction.category,
      comment: transaction.comment,
      account: transaction.account,
    });
    setEditingId(transaction.transaction_id);
    setShowForm(true);
  };

  const toggleSelect = (id: number) => {
    setSelectedTransactions((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const selectAllVisible = () =>
    setSelectedTransactions(filteredTransactions.map((t) => t.transaction_id));
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

  const handleDeleteTransactions = async () => {
    if (selectedTransactions.length === 0) return;
    try {
      const res = await fetch("/api/transactions/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionIds: selectedTransactions }),
      });
      if (!res.ok) throw new Error("Erro ao remover transações");
      setTransactions((prev) =>
        prev.filter((t) => !selectedTransactions.includes(t.transaction_id))
      );
      setSelectedTransactions([]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", backgroundColor: "#f5f5f5" }}>
      <h1 style={{ fontSize: "2rem", color: "#7c2ea0", marginBottom: "1rem" }}>Dashboard</h1>

      <input
        type="text"
        placeholder="Filtrar transações..."
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        style={{ marginBottom: "1rem", padding: "0.5rem", width: "300px", borderRadius: "6px", border: "1px solid #ccc" }}
      />

      <button
        style={{
          marginBottom: "1rem",
          backgroundColor: "#7c2ea0",
          color: "white",
          padding: "0.5rem 1rem",
          borderRadius: "6px",
          cursor: "pointer",
          marginLeft: "1rem",
        }}
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? "Fechar" : editingId ? "Editar Transação" : "Adicionar Transação"}
      </button>

      {showForm && (
        <form
          onSubmit={handleAddOrEditTransaction}
          style={{
            marginBottom: "1.5rem",
            backgroundColor: "white",
            padding: "1rem",
            borderRadius: "8px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            maxWidth: "400px",
          }}
        >
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          <input type="text" placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <input type="number" placeholder="Valor" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <input type="text" placeholder="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input type="text" placeholder="Comentário" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
          <input type="text" placeholder="Conta" value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} />
          <button
            type="submit"
            style={{
              backgroundColor: "#7c2ea0",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              cursor: "pointer",
              marginTop: "0.5rem",
            }}
          >
            {editingId ? "Salvar Alterações" : "Adicionar"}
          </button>
        </form>
      )}

      <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button onClick={selectAllVisible} style={{ padding: "0.3rem 0.6rem", borderRadius: "4px", backgroundColor: "#ccc" }}>Selecionar Visíveis</button>
        <button onClick={deselectAll} style={{ padding: "0.3rem 0.6rem", borderRadius: "4px", backgroundColor: "#ccc" }}>Desmarcar Todos</button>
        <input
          type="text"
          placeholder="Categoria em massa"
          value={bulkCategory}
          onChange={(e) => setBulkCategory(e.target.value)}
          style={{ padding: "0.3rem 0.6rem", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <button onClick={handleBulkCategoryChange} style={{ backgroundColor: "#7c2ea0", color: "white", padding: "0.3rem 0.6rem", borderRadius: "4px" }}>
          Atualizar Categoria
        </button>
        <button onClick={handleDeleteTransactions} style={{ backgroundColor: "#f98c39", color: "white", padding: "0.3rem 0.6rem", borderRadius: "4px" }}>
          Remover Selecionadas
        </button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white", borderRadius: "6px", overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
        <thead style={{ backgroundColor: "#eaeaea" }}>
          <tr>
            <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>Sel.</th>
            <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>Data</th>
            <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>Descrição</th>
            <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>Valor</th>
            <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>Categoria</th>
            <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>Comentário</th>
            <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>Conta</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions.map((t) => (
            <tr key={t.transaction_id} style={{ textAlign: "center" }}>
              <td style={{ border: "1px solid #ccc", padding: "0.3rem" }}>
                <input type="checkbox" checked={selectedTransactions.includes(t.transaction_id)} onChange={() => toggleSelect(t.transaction_id)} />
              </td>
              <td style={{ border: "1px solid #ccc", padding: "0.3rem" }}>{t.date}</td>
              <td style={{ border: "1px solid #ccc", padding: "0.3rem", cursor: "pointer", color: "#7c2ea0" }}
                  onClick={() => handleEditClick(t)}>
                {t.description}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "0.3rem" }}>{t.amount}</td>
              <td style={{ border: "1px solid #ccc", padding: "0.3rem" }}>{t.category}</td>
              <td style={{ border: "1px solid #ccc", padding: "0.3rem" }}>{t.comment}</td>
              <td style={{ border: "1px solid #ccc", padding: "0.3rem" }}>{t.account}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
