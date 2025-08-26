"use client";
import { useState, useEffect, useMemo } from "react";
import { Pie } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
Chart.register(ArcElement, Tooltip, Legend);

function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = date.getDate().toString().padStart(2, "0");
    const month = date.toLocaleString("pt-BR", { month: "short" }).replace('.', '');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
}

// Função para formatar como moeda BRL
function formatCurrency(value: number | string) {
    const num = typeof value === "string" ? Number(value) : value;
    if (isNaN(num)) return value;
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

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

    const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; direction: "asc" | "desc" } | null>(null);
    const [columnFilters, setColumnFilters] = useState<{ [key: string]: string }>({});

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
    const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);

    const [files, setFiles] = useState<File[]>([]);
    const [fileContents, setFileContents] = useState<string[]>([]);

    const getToday = () => new Date().toISOString().slice(0, 10);

    const [form, setForm] = useState({
        date: getToday(),
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
    const [categories, setCategories] = useState<string[]>([]);
    const [accounts, setAccounts] = useState<string[]>([]);

    const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : "1";

    const displayedTransactions = sortTransactions(filterTransactions(filteredTransactions));

    const monthsList = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const [yearFilter, setYearFilter] = useState<string>(""); // Começa vazio
    const [monthFilter, setMonthFilter] = useState<string>("Todos");
    const [availableYears, setAvailableYears] = useState<string[]>([]);

    // === FUNÇÃO DE LOGOUT ===
    const handleLogout = () => {
        localStorage.removeItem("userId");
        window.location.href = "/";
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files).filter(
            (f) =>
                f.type === "text/plain" ||
                f.name.endsWith(".csv") ||
                f.name.endsWith(".xls") ||
                f.name.endsWith(".xlsm")
        );
        setFiles((prev) => [...prev, ...droppedFiles]);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };



    // Sempre busca todos os anos do usuário, independente do filtro
    useEffect(() => {
        if (!userId) return;
        fetch(`/api/years?userId=${userId}`)
            .then(res => res.json())
            .then(data => {
                const years = data.years || [];
                setAvailableYears(years);
                // Seleciona o ano atual na primeira carga
                if (!yearFilter && years.length > 0) {
                    const currentYear = new Date().getFullYear().toString();
                    setYearFilter(years.includes(currentYear) ? currentYear : years[0]);
                }
            })
            .catch(err => console.error(err));
    }, [userId]);

    useEffect(() => {
        if (!userId) return;
        const params = new URLSearchParams({ userId, year: yearFilter });
        if (monthFilter !== "Todos") params.append("month", (monthsList.findIndex(m => m === monthFilter) + 1).toString());
        fetch(`/api/transactions?${params.toString()}`)
            .then((res) => res.json())
            .then((data) => {
                setTransactions(data);
                setFilteredTransactions(data);
            })
            .catch((err) => console.error(err));
    }, [userId, yearFilter, monthFilter]);

    // Função para ordenar
    function sortTransactions(transactions: Transaction[]) {
        if (!sortConfig) {
            // Ordena por data decrescente (mais recente primeiro)
            return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        return [...transactions].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];
            if (typeof aValue === "number" && typeof bValue === "number") {
                return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
            }
            return sortConfig.direction === "asc"
                ? String(aValue).localeCompare(String(bValue))
                : String(bValue).localeCompare(String(aValue));
        });
    }

    // Função para filtrar
    function filterTransactions(transactions: Transaction[]) {
        return transactions.filter((t) =>
            Object.entries(columnFilters).every(([key, value]) =>
                value ? String(t[key as keyof Transaction]).toLowerCase().includes(value.toLowerCase()) : true
            )
        );
    }


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

    useEffect(() => {
        async function fetchCategories() {
            const res = await fetch(`/api/categories?userId=${userId}`);
            const data = await res.json();
            setCategories(data.categories || []);
        }
        fetchCategories();
    }, [userId]);

    useEffect(() => {
        async function fetchAccounts() {
            const res = await fetch(`/api/accounts?userId=${userId}`);
            const data = await res.json();
            setAccounts(data.accounts || []);
        }
        fetchAccounts();
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
                // Se não houver data, coloca a data de hoje automaticamente
                const today = new Date().toISOString().slice(0, 10);
                const res = await fetch("/api/transactions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...form,
                        date: form.date || today,
                        amount: Number(form.amount),
                        userId
                    }),
                });
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const newTransaction = await res.json();
                setTransactions((prev) => [newTransaction, ...prev]);
            }
            // Quando fechar o formulário ou adicionar/editar, resete o form com a data de hoje:
            setForm({
                date: getToday(),
                description: "",
                amount: "",
                category: "",
                comment: "",
                account: "",
            });
            setShowForm(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleEditClick = (transaction: Transaction) => {
        // Converte para yyyy-MM-dd
        const dateObj = new Date(transaction.date);
        const formattedDate = !isNaN(dateObj.getTime())
            ? dateObj.toISOString().slice(0, 10)
            : transaction.date;

        setForm({
            date: formattedDate,
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
            setTransactions((prev) => {
                // Remove as transações selecionadas
                const updated = prev.filter((t) => !selectedTransactions.includes(t.transaction_id));
                // Se houver transações restantes e alguma categoria foi removida,
                // atualiza a categoria das removidas para a próxima da lista
                if (updated.length > 0 && selectedTransactions.length > 0) {
                    const nextCategory = updated[0].category;
                    return updated.map(t =>
                        selectedTransactions.includes(t.transaction_id)
                            ? { ...t, category: nextCategory }
                            : t
                    );
                }
                return updated;
            });
            setSelectedTransactions([]);
        } catch (err) {
            console.error(err);
        }
    };

    // Cálculo dos totais
    const totalAmount = displayedTransactions
        .filter(t => t.category !== "Ignorado")
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalSaidas = displayedTransactions
        .filter(t => t.amount < 0 && t.category !== "Ignorado")
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalEntradas = displayedTransactions
        .filter(t => t.amount > 0 && t.category !== "Ignorado")
        .reduce((sum, t) => sum + Number(t.amount), 0);

    // Dados para o gráfico de pizza (Pie Chart)
    const pieData = useMemo(() => {
        // Agrupa valores negativos por categoria
        const gastosPorCategoria: { [cat: string]: number } = {};
        displayedTransactions.forEach(t => {
            if (t.amount < 0 && t.category !== "Ignorado") {
                gastosPorCategoria[t.category] = (gastosPorCategoria[t.category] || 0) + Math.abs(Number(t.amount));
            }
        });

        // Ordena categorias por valor decrescente
        const categoriasOrdenadas = Object.entries(gastosPorCategoria)
            .sort((a, b) => b[1] - a[1]);

        let categorias: string[] = [];
        let valores: number[] = [];

        if (categoriasOrdenadas.length > 8) {
            // Mostra as 8 maiores, o resto agrupa em "Outros"
            const maiores = categoriasOrdenadas.slice(0, 8);
            const outros = categoriasOrdenadas.slice(8);
            categorias = maiores.map(([cat]) => cat);
            valores = maiores.map(([, val]) => val);

            const outrosValor = outros.reduce((sum, [, val]) => sum + val, 0);
            if (outrosValor > 0) {
                categorias.push("Outros");
                valores.push(outrosValor);
            }
        } else {
            categorias = categoriasOrdenadas.map(([cat]) => cat);
            valores = categoriasOrdenadas.map(([, val]) => val);
        }

        return {
            labels: categorias,
            datasets: [
                {
                    data: valores,
                    backgroundColor: [
                        "#7c2ea0", "#f98c39", "#388e3c", "#d32f2f", "#1976d2", "#fbc02d", "#8d6e63", "#0288d1", "#cccccc"
                    ],
                },
            ],
        };
    }, [displayedTransactions]);

    // === ENVIAR CONTEÚDOS PARA OUTRA ROTA ===


    const handleProcessFiles = async () => {
        const formData = new FormData();
        files.forEach((f) => formData.append("files", f));
        formData.append("userId", localStorage.getItem("userId")!);

        const res = await fetch("/api/import", {
            method: "POST",
            body: formData, // ⚠️ Não passe JSON, use FormData!
        });

        const data = await res.json();
        console.log(data);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };


    return (
        <div style={{ padding: "2rem", fontFamily: "sans-serif", backgroundColor: "#f5f5f5" }}>
            <h1 style={{ fontSize: "2rem", color: "#7c2ea0", marginBottom: "1rem" }}>Dashboard</h1>

            {/* BOTÃO LOGOUT TOPO DIREITO */}
            <button
                onClick={handleLogout}
                style={{
                    position: "absolute",
                    top: "1rem",
                    right: "1rem",
                    backgroundColor: "#d32f2f",
                    color: "white",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                }}
            >
                Logout
            </button>


            {/* ÁREA DE UPLOAD */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                style={{
                    border: "2px dashed #7c2ea0",
                    borderRadius: "8px",
                    padding: "2rem",
                    textAlign: "center",
                    marginBottom: "1.5rem",
                    backgroundColor: "#fff",
                }}
            >
                <p>Arraste arquivos .txt ou .csv aqui</p>
                <p style={{ fontSize: "0.9rem", color: "#666" }}>
                    (Você pode soltar múltiplos arquivos)
                </p>

                {files.length > 0 && (
                    <div style={{ marginTop: "1rem", textAlign: "left" }}>
                        <strong>Arquivos carregados:</strong>
                        <ul>
                            {files.map((f, i) => (
                                <li key={i}>{f.name}</li>
                            ))}
                        </ul>
                        <button
                            onClick={handleProcessFiles}
                            style={{
                                marginTop: "0.5rem",
                                backgroundColor: "#7c2ea0",
                                color: "white",
                                padding: "0.5rem 1rem",
                                borderRadius: "6px",
                                cursor: "pointer",
                            }}
                        >
                            Processar Arquivos
                        </button>
                    </div>
                )}
            </div>

            {/* ... resto do seu dashboard permanece igual ... */}



            {/* Filtros de Ano e Mês */}
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", alignItems: "center" }}>
                <label>
                    Ano:&nbsp;
                    <select
                        value={yearFilter}
                        onChange={e => setYearFilter(e.target.value)}
                        style={{ padding: "0.3rem 0.6rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    >
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </label>
                <label>
                    Mês:&nbsp;
                    <select
                        value={monthFilter}
                        onChange={e => setMonthFilter(e.target.value)}
                        style={{ padding: "0.3rem 0.6rem", borderRadius: "4px", border: "1px solid #ccc" }}
                    >
                        <option value="Todos">Todos</option>
                        {monthsList.map(month => (
                            <option key={month} value={month}>{month}</option>
                        ))}
                    </select>
                </label>
            </div>

            <div style={{ display: "flex", gap: "2rem", marginBottom: "1.5rem", alignItems: "center" }}>
                <div style={{ fontWeight: "bold", color: "#7c2ea0" }}>
                    Total:&nbsp;{formatCurrency(totalAmount)}
                </div>
                <div style={{ fontWeight: "bold", color: "#d32f2f" }}>
                    Saídas:&nbsp;{formatCurrency(totalSaidas)}
                </div>
                <div style={{ fontWeight: "bold", color: "#388e3c" }}>
                    Entradas:&nbsp;{formatCurrency(totalEntradas)}
                </div>
            </div>

            <div style={{ maxWidth: "400px", margin: "2rem auto" }}>
                <h3 style={{ textAlign: "center", color: "#7c2ea0", marginBottom: "0.5rem" }}>Gastos por Categoria</h3>
                <Pie data={pieData} />
            </div>

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
                    {/* Data e Valor na mesma linha, ocupando 100% do espaço do formulário */}
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", width: "100%" }}>
                        <input
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                            required
                            style={{ flex: 1, minWidth: 0 }}
                        />
                        <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
                            <input
                                type="text"
                                placeholder="Valor"
                                value={form.amount}
                                onChange={e => {
                                    let val = e.target.value.replace(",", ".").replace(/[^0-9.-]/g, "");
                                    // Permite valor negativo ou positivo, não força "-"
                                    setForm({ ...form, amount: val });
                                }}
                                required
                                style={{
                                    paddingLeft: "2.2rem",
                                    width: "100%",
                                    boxSizing: "border-box",
                                }}
                            />
                            <span
                                style={{
                                    position: "absolute",
                                    left: "0.7rem",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#7c2ea0",
                                    fontWeight: "bold",
                                    pointerEvents: "none",
                                }}
                            >
                                R$
                            </span>
                        </div>
                    </div>
                    {/* ...restante do formulário... */}
                    <input type="text" placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <select
                            value={form.category}
                            onChange={e => setForm({ ...form, category: e.target.value })}
                            style={{ flex: 1 }}
                        >
                            <option value="">Selecione</option>
                            {categories.length === 0 && (
                                <option disabled value="">Nenhuma categoria cadastrada</option>
                            )}
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="Ou digite uma categoria"
                            value={form.category}
                            onChange={e => setForm({ ...form, category: e.target.value })}
                            style={{ flex: 2 }}
                            required
                        />
                    </div>
                    <input type="text" placeholder="Comentário" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <select
                            value={form.account}
                            onChange={e => setForm({ ...form, account: e.target.value })}
                            style={{
                                flex: 1,
                                maxWidth: "120px", // limite de largura
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                overflow: "hidden"
                            }}

                        >
                            <option value="">Selecione</option>
                            {accounts.map(acc => (
                                <option key={acc} value={acc}>
                                    {acc.length > 20 ? acc.slice(0, 20) + "..." : acc}
                                </option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="Ou digite uma conta"
                            value={form.account}
                            onChange={e => setForm({ ...form, account: e.target.value })}
                            style={{ flex: 2 }}
                            required
                        />
                    </div>
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
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <select
                        value={bulkCategory}
                        onChange={e => setBulkCategory(e.target.value)}
                        style={{ padding: "0.3rem 0.6rem", borderRadius: "4px", border: "1px solid #ccc", flex: 1 }}
                    >
                        <option value="">Categoria em massa</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="Ou digite uma categoria"
                        value={bulkCategory}
                        onChange={e => setBulkCategory(e.target.value)}
                        style={{ flex: 2 }}
                    />
                </div>
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
                        {["date", "description", "amount", "category", "comment", "account"].map((col) => (
                            <th
                                key={col}
                                style={{ border: "1px solid #ccc", padding: "0.5rem", cursor: "pointer" }}
                                onClick={() =>
                                    setSortConfig((prev) =>
                                        prev && prev.key === col
                                            ? { key: col as keyof Transaction, direction: prev.direction === "asc" ? "desc" : "asc" }
                                            : { key: col as keyof Transaction, direction: "asc" }
                                    )
                                }
                            >
                                {col.charAt(0).toUpperCase() + col.slice(1)}
                                {sortConfig?.key === col && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                                <br />
                                <input
                                    type="text"
                                    placeholder="Filtrar"
                                    value={columnFilters[col] || ""}
                                    onClick={e => e.stopPropagation()}
                                    onChange={e =>
                                        setColumnFilters((prev) => ({ ...prev, [col]: e.target.value }))
                                    }
                                    style={{ width: "80px", fontSize: "0.8rem" }}
                                />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {displayedTransactions.map((t) => (
                        <tr key={t.transaction_id} style={{ textAlign: "center" }}>
                            <td style={{ border: "1px solid #ccc", padding: "0.3rem" }}>
                                <input type="checkbox" checked={selectedTransactions.includes(t.transaction_id)} onChange={() => toggleSelect(t.transaction_id)} />
                            </td>
                            <td style={{ border: "1px solid #ccc", padding: "0.3rem" }}>{formatDate(t.date)}</td>
                            <td style={{ border: "1px solid #ccc", padding: "0.3rem", cursor: "pointer", color: "#7c2ea0" }}
                                onClick={() => handleEditClick(t)}>
                                {t.description}
                            </td>
                            <td style={{ border: "1px solid #ccc", padding: "0.3rem" }}>
                                {formatCurrency(t.amount)}
                            </td>
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
