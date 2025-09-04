"use client";
import { useEffect, useState } from "react";

type BankParseParam = {
    id: number;
    colDate: number;
    colDesc: number;
    colValSpent: number;
    colValEarned: number;
    colComment: number;
    source: string;
    removeDots: boolean;
    startRow: number;
    changeSignal: boolean;
    colCategory: string;
};

export default function AdminPanel() {
    const [records, setRecords] = useState<BankParseParam[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [form, setForm] = useState<Omit<BankParseParam, "id">>({
        colDate: 0,
        colDesc: 0,
        colValSpent: 0,
        colValEarned: 0,
        colComment: 0,
        source: "",
        removeDots: false,
        startRow: 10,
        changeSignal: true,
        colCategory: "To be Defined",
    });

    // Carregar registros
    const loadRecords = async () => {
        try {
            const res = await fetch("/api/bank-params");
            const data = await res.json();
            setRecords(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadRecords();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                // PUT
                const res = await fetch("/api/bank-params", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: editingId, ...form }),
                });
                if (!res.ok) throw new Error("Erro ao atualizar");
            } else {
                // POST
                const res = await fetch("/api/bank-params", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form),
                });
                if (!res.ok) throw new Error("Erro ao adicionar");
            }
            resetForm();
            loadRecords();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Tem certeza que deseja remover este registro?")) return;
        try {
            const res = await fetch(`/api/bank-params?id=${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Erro ao remover");
            loadRecords();
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (record: BankParseParam) => {
        setForm({ ...record });
        setEditingId(record.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const resetForm = () => {
        setForm({
            colDate: 0,
            colDesc: 0,
            colValSpent: 0,
            colValEarned: 0,
            colComment: 0,
            source: "",
            removeDots: false,
            startRow: 10,
            changeSignal: true,
            colCategory: "To be Defined",
        });
        setEditingId(null);
        setShowForm(false);
    };

    return (
        <div style={{ padding: "2rem", fontFamily: "sans-serif", backgroundColor: "#f5f5f5" }}>

            <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
                <a href="/dashboard">
                    <img src="/img/Logo_Principal.png" alt="Logo" style={{ height: "60px" }} />
                </a>
            </div>

            {/*<h1 style={{ fontSize: "2rem", color: "#7c2ea0", marginBottom: "1rem" }}>Dashboard</h1>*/}



            <h1 style={{ fontSize: "1.5rem", color: "#7c2ea0", marginBottom: "1rem" }}>
                Painel Admin - Bank Parse Params
            </h1>

            <button
                onClick={() => setShowForm(prev => !prev)}
                style={{
                    background: "#7c2ea0",
                    color: "white",
                    padding: "0.6rem 1.2rem",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    marginBottom: "1rem",
                }}
            >
                {showForm ? "Fechar Formulário" : "Adicionar Registro"}
            </button>

            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    style={{
                        background: "white",
                        padding: "1rem",
                        borderRadius: "8px",
                        marginBottom: "1.5rem",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                        display: "grid",
                        gap: "0.5rem",
                    }}
                >
                    {Object.keys(form).map((key) => (
                        <div key={key} style={{ display: "flex", flexDirection: "column" }}>
                            <label style={{ fontWeight: "bold" }}>{key}</label>
                            {typeof form[key as keyof typeof form] === "boolean" ? (
                                <input
                                    type="checkbox"
                                    checked={form[key as keyof typeof form] as boolean}
                                    onChange={(e) =>
                                        setForm({ ...form, [key]: e.target.checked })
                                    }
                                />
                            ) : (
                                <input
                                    type={typeof form[key as keyof typeof form] === "number" ? "number" : "text"}
                                    value={form[key as keyof typeof form] as string | number}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            [key]:
                                                typeof form[key as keyof typeof form] === "number"
                                                    ? Number(e.target.value)
                                                    : e.target.value,
                                        })
                                    }
                                    required={["source"].includes(key)}
                                />
                            )}
                        </div>
                    ))}

                    <div style={{ display: "flex", gap: "1rem" }}>
                        <button
                            type="submit"
                            style={{
                                background: "#388e3c",
                                color: "white",
                                padding: "0.6rem 1.2rem",
                                borderRadius: "6px",
                                border: "none",
                                cursor: "pointer",
                            }}
                        >
                            {editingId ? "Salvar Alterações" : "Adicionar"}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            style={{
                                background: "#d32f2f",
                                color: "white",
                                padding: "0.6rem 1.2rem",
                                borderRadius: "6px",
                                border: "none",
                                cursor: "pointer",
                            }}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            <table
                style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    background: "white",
                    borderRadius: "8px",
                    overflow: "hidden",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                }}
            >
                <thead style={{ background: "#7c2ea0", color: "white" }}>
                    <tr>
                        {["ID", ...Object.keys(form), "Ações"].map((col) => (
                            <th key={col} style={{ padding: "0.6rem", textAlign: "left" }}>
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {records.length > 0 ? (
                        records.map((r) => (
                            <tr key={r.id} style={{ borderBottom: "1px solid #ddd" }}>
                                <td style={{ padding: "0.6rem" }}>{r.id}</td>
                                <td style={{ padding: "0.6rem" }}>{r.colDate}</td>
                                <td style={{ padding: "0.6rem" }}>{r.colDesc}</td>
                                <td style={{ padding: "0.6rem" }}>{r.colValSpent}</td>
                                <td style={{ padding: "0.6rem" }}>{r.colValEarned}</td>
                                <td style={{ padding: "0.6rem" }}>{r.colComment}</td>
                                <td style={{ padding: "0.6rem" }}>{r.source}</td>
                                <td style={{ padding: "0.6rem" }}>{r.removeDots ? "✔️" : "❌"}</td>
                                <td style={{ padding: "0.6rem" }}>{r.startRow}</td>
                                <td style={{ padding: "0.6rem" }}>{r.changeSignal ? "✔️" : "❌"}</td>
                                <td style={{ padding: "0.6rem" }}>{r.colCategory}</td>
                                <td style={{ padding: "0.6rem" }}>
                                    <a
                                        href="#"
                                        onClick={() => handleEdit(r)}
                                        style={{ marginRight: "1rem", color: "#7c2ea0" }}
                                    >
                                        Editar
                                    </a>
                                    <button
                                        onClick={() => handleDelete(r.id)}
                                        style={{
                                            background: "#d32f2f",
                                            color: "white",
                                            padding: "0.3rem 0.6rem",
                                            borderRadius: "4px",
                                            border: "none",
                                            cursor: "pointer",
                                        }}
                                    >
                                        Remover
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={12} style={{ padding: "1rem", textAlign: "center" }}>
                                Nenhum registro encontrado
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
