"use client";
import type { UserCategory } from '../types/user_category';

import type { Transaction } from "../types/transaction";
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Legend, Tooltip } from "chart.js";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useState, useEffect, useMemo } from "react";
import PieChartTab from "../dashboard/PieChartTab";
import BarChartTab from "../dashboard/BarChartTab";
import UploadTab from "../dashboard/UploadTab";
import PlanningTab from './PlanningTab';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

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


    // categories: array de UserCategory vindo do estado ou API
    // Garantir que categories é um array antes de mapear
    const [categories, setCategories] = useState<UserCategory[]>([]);

    // Depois que categories existe
    const userCategories: { category: string; icon: string }[] = categories.map(cat => ({
        category: cat.category,
        icon: cat.iconUrl ?? "💰",
    }));

    const [accounts, setAccounts] = useState<string[]>([]);

    //const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : "0";
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        setUserId(localStorage.getItem("userId"));
    }, []);
    const userIdNumeric = Number(userId) || 0;

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
                f.name.endsWith(".xlsx") ||
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
        const filtered = transactions.filter((t) => {
            // filtro global
            const matchesGlobal = filterText
                ? t.description.toLowerCase().includes(filterText.toLowerCase()) ||
                t.category.toLowerCase().includes(filterText.toLowerCase()) ||
                t.comment.toLowerCase().includes(filterText.toLowerCase()) ||
                t.account.toLowerCase().includes(filterText.toLowerCase())
                : true;

            // filtro por coluna
            const matchesColumn = Object.entries(columnFilters).every(([col, val]) => {
                if (!val) return true;
                return String(t[col as keyof Transaction]).toLowerCase().includes(val.toLowerCase());
            });

            return matchesGlobal && matchesColumn;
        });

        setFilteredTransactions(filtered);

        // mantém apenas os selecionados que ainda estão visíveis
        setSelectedTransactions((prevSelected) =>
            prevSelected.filter((id) => filtered.some((t) => t.transaction_id === id))
        );
    }, [filterText, columnFilters, transactions]);

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

        window.scrollTo({ top: 850, behavior: "smooth" });
    };

    const toggleSelect = (id: number) => {
        setSelectedTransactions((prev) =>
            prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
        );
    };

    const selectAllVisible = () => {
        setSelectedTransactions(prev => {
            const visibleIds = filteredTransactions.map(t => t.transaction_id);
            const newSelection = [...new Set([...prev, ...visibleIds])];
            return newSelection;
        });
    };

    const deselectAll = () => setSelectedTransactions([]);

    const loadTransactions = async () => {
        if (!userId) return;
        const params = new URLSearchParams({ userId });
        if (yearFilter) params.append("year", yearFilter);
        if (monthFilter !== "Todos") params.append("month", (monthsList.findIndex(m => m === monthFilter) + 1).toString());

        try {
            const res = await fetch(`/api/transactions?${params.toString()}`);
            if (!res.ok) throw new Error("Erro ao carregar transações");
            const data = await res.json();
            setTransactions(data);
            setFilteredTransactions(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleBulkCategoryChange = async () => {
        if (!bulkCategory || selectedTransactions.length === 0) return;
        try {
            const res = await fetch("/api/transactions/update-category", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: userId, // <-- adicionado
                    transactionIds: selectedTransactions,
                    category: bulkCategory
                }),
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

    // Dentro do seu componente:
    const barData = useMemo(() => {
        const monthlyData: { [month: number]: { entradas: number; saidas: number } } = {};
        for (let i = 0; i < 12; i++) {
            monthlyData[i] = { entradas: 0, saidas: 0 };
        }

        displayedTransactions.forEach(t => {
            const date = new Date(t.date);
            if (!isNaN(date.getTime()) && t.category !== "Ignorado") {
                const month = date.getMonth();
                if (t.amount > 0) monthlyData[month].entradas += t.amount;
                if (t.amount < 0) monthlyData[month].saidas += Math.abs(t.amount);
            }
        });

        return {
            labels: monthsList,
            datasets: [
                {
                    label: "Entradas",
                    data: monthsList.map((_, i) => monthlyData[i].entradas),
                    backgroundColor: "#388e3c"
                },
                {
                    label: "Saídas",
                    data: monthsList.map((_, i) => monthlyData[i].saidas),
                    backgroundColor: "#d32f2f"
                }
            ]
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

        if (res.ok && data.success) {
            const { insertedTransactions, createdCategories, failedTransactions } = data.summary;

            let message = `Arquivos processados com sucesso!\n\n` +
                `Transações inseridas: ${insertedTransactions}\n` +
                `Categorias criadas: ${createdCategories}\n` +
                `Transações com erro ou duplicadas: ${failedTransactions}\n\n` +
                `Deseja limpar a lista de arquivos?`;

            const shouldClear = window.confirm(message);
            if (shouldClear) {
                setFiles([]);
                await loadTransactions(); // recarrega a tabela
            } else {
                await loadTransactions();
            }
        } else {
            await loadTransactions();
            alert("Erro ao processar arquivos. Tente novamente.");
        }
    };


    const handleDownloadXLS = () => {
        if (!transactions || transactions.length === 0) {
            alert("Não há transações para exportar.");
            return;
        }

        // Cria os dados no mesmo formato da tabela
        const dataToExport = transactions.map(t => ({
            "Data": formatDate(t.date),
            "Descrição": t.description,
            "Valor": t.amount,
            "Categoria": t.category,
            "Comentário": t.comment,
            "Conta": t.account,
        }));

        // Cria a planilha
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Transações");

        // Converte para blob e faz download
        const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([wbout], { type: "application/octet-stream" });
        saveAs(blob, `transacoes_usuario_${userId}.xlsx`);
    };


    const [activeTab, setActiveTab] = useState<"pie" | "transactions" | "upload" | "planning">("pie");

    const tabStyle = (tab: "pie" | "transactions" | "upload" | "planning") => ({
        padding: "10px 20px",
        cursor: "pointer",
        borderBottom: activeTab === tab ? "2px solid #007bff" : "2px solid transparent",
        color: activeTab === tab ? "#007bff" : "#555",
        fontWeight: activeTab === tab ? 600 : 400,
        transition: "all 0.3s ease",
    });



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
                Logout {userId ? `(${userId})` : ""}
            </button>



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

            {/* Conteúdo das abas */}


            <div style={{ display: "flex", marginBottom: "1rem" }}>
                <div style={tabStyle("pie")} onClick={() => setActiveTab("pie")}>Gráfico PIE</div>
                <div style={tabStyle("transactions")} onClick={() => setActiveTab("transactions")}>Gráfico Barra</div>
                <div style={tabStyle("upload")} onClick={() => setActiveTab("upload")}>Upload CSV </div>
                <div style={tabStyle("planning")} onClick={() => setActiveTab("planning")}>Planejamento</div>
            </div>


            <div>

                {activeTab === "pie" && <PieChartTab transactions={displayedTransactions} />}
                {activeTab === "transactions" && <BarChartTab transactions={displayedTransactions} />}
                {activeTab === "upload" && (
                    <UploadTab
                        files={files}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onProcessFiles={handleProcessFiles}
                    />
                )}
                {activeTab === "planning" && <PlanningTab transactions={displayedTransactions} userId={userIdNumeric} month={monthFilter} year={yearFilter} />}

            </div>
            {/* Conteúdo das abas */}



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
                            {categories
                                .slice() // cria uma cópia para não mutar o estado
                                .sort((a, b) => a.category.localeCompare(b.category)) // ordena alfabeticamente pelo nome da categoria
                                .map((cat) => (
                                    <option key={cat.id} value={cat.category}>
                                        {cat.category}
                                    </option>
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
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.category}>
                                {cat.category}
                            </option>
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

                <button
                    onClick={handleDownloadXLS}
                    style={{
                        backgroundColor: "#388e3c",
                        color: "white",
                        padding: "0.3rem 0.6rem",
                        borderRadius: "4px",
                        cursor: "pointer"

                    }}
                >
                    Baixar XLS
                </button>

                <button onClick={handleDeleteTransactions} style={{ backgroundColor: "#f98c39", color: "white", padding: "0.3rem 0.6rem", borderRadius: "4px" }}>
                    Remover Selecionadas
                </button>
            </div>


            <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white", borderRadius: "6px", overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
                <thead style={{ backgroundColor: "#eaeaea" }}>
                    <tr>
                        <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>Sel.</th>
                        <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>{/* Nova coluna */}</th>
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
                    {displayedTransactions.map((t) => {
                        const isIgnored = t.category === "Ignorado";
                        const isNegative = t.amount < 0;

                        const textStyle: React.CSSProperties = {
                            textDecoration: isIgnored ? "line-through" : "none",
                            color: isNegative ? "#8B0000" : "inherit",
                            cursor: "pointer",
                        };


                        // Busca o emoji da categoria
                        const categoryIcon = userCategories.find((c) => c.category === t.category)?.icon ?? "💰";

                        return (
                            <tr key={t.transaction_id} style={{ textAlign: "center" }}>
                                <td style={{ border: "1px solid #ccc", padding: "0.3rem" }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedTransactions.includes(t.transaction_id)}
                                        onChange={() => toggleSelect(t.transaction_id)}
                                    />
                                </td>
                                <td style={{ border: "1px solid #ccc", padding: "0.3rem", fontSize: "20px" }}>
                                    {categoryIcon} {/* Mostra o emoji */}
                                </td>
                                <td style={{ border: "1px solid #ccc", padding: "0.3rem", ...textStyle }}>
                                    {formatDate(t.date)}
                                </td>
                                <td
                                    style={{ border: "1px solid #ccc", padding: "0.3rem", ...textStyle }}
                                    onClick={() => handleEditClick(t)}
                                >
                                    {t.description}
                                </td>
                                <td style={{ border: "1px solid #ccc", padding: "0.3rem", ...textStyle }}>
                                    {formatCurrency(t.amount)}
                                </td>
                                <td style={{ border: "1px solid #ccc", padding: "0.3rem", ...textStyle }}>
                                    {t.category}
                                </td>
                                <td style={{ border: "1px solid #ccc", padding: "0.3rem", ...textStyle }}>
                                    {t.comment}
                                </td>
                                <td style={{ border: "1px solid #ccc", padding: "0.3rem", ...textStyle }}>
                                    {t.account}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>

            </table>
        </div>
    );

}
