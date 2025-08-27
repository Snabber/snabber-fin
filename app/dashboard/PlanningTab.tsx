"use client";
import type { Transaction } from "../types/transaction";
import { useEffect, useState } from "react";

interface PlanningTabProps {
  transactions: Transaction[];
  userId: number; // recebido do dashboard
  month: string; // 0 = janeiro, 11 = dezembro
  year: string;
}

type UserCategory = {
  id: number;
  category: string;
  monthlyLimit: number | null;
  iconUrl: string | null;
  averageMonthly: number;
  usedThisMonth: number;
};

const ICON_OPTIONS = [
  { label: "💰", value: "💰" }, // dinheiro
  { label: "🍔", value: "🍔" }, // comida
  { label: "🏠", value: "🏠" }, // casa
  { label: "🚗", value: "🚗" }, // transporte
  { label: "🎁", value: "🎁" }, // presentes
  { label: "🍼", value: "🍼" }, // bebê/mamadeira
  { label: "👶", value: "👶" }, // bebê
  { label: "🧸", value: "🧸" }, // brinquedo
  { label: "🎈", value: "🎈" }, // festa
  { label: "📚", value: "📚" }, // educação
  { label: "💻", value: "💻" }, // tecnologia
  { label: "⚽", value: "⚽" }, // esporte/lazer
  { label: "🍹", value: "🍹" }, // bebidas
  { label: "🛒", value: "🛒" }, // compras/mercado
  { label: "💡", value: "💡" }, // energia
  { label: "📈", value: "📈" }, // investimentos
];

const monthsList = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const PlanningTab: React.FC<PlanningTabProps> = ({ transactions, userId, month, year }) => {
  const [categories, setCategories] = useState<UserCategory[]>([]);
  const [editingLimits, setEditingLimits] = useState<Record<number, number>>({});
  const [newCategory, setNewCategory] = useState<string>("");

  // Carrega categorias do usuário
  useEffect(() => {
    async function fetchCategories() {
      const res = await fetch(`/api/categories?userId=${userId}`);
      const data = await res.json();

      const now = new Date();
      //const currentMonth = now.getMonth();
      //const currentYear = now.getFullYear();

      const currentYear = Number(year); // converte string para número

      // Para month, se "Todos" usar undefined ou -1
      const currentMonth = month === "Todos" ? now.getMonth() : monthsList.findIndex(m => m === month);

      const enriched = data.categories.map((cat: any) => {
        // Filtra transações da categoria
        const catTransactions = transactions.filter(
          (t) => t.category === cat.category
        );

        // Soma usado no mês atual
        const usedThisMonth = parseFloat(
          (
            catTransactions
              .filter((t) => {
                const tDate = new Date(t.date);
                return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
              })
              .reduce((sum, t) => sum + t.amount, 0) * -1
          ).toFixed(2)
        );

        // Calcula média mensal dos últimos 12 meses
        const months = Array.from({ length: 12 }, (_, i) => {
          const month = (currentMonth - i + 12) % 12;
          const year = month > currentMonth ? currentYear - 1 : currentYear;

          return parseFloat(
            (
              catTransactions
                .filter((t) => {
                  const tDate = new Date(t.date);
                  return tDate.getMonth() === month && tDate.getFullYear() === year;
                })
                .reduce((sum, t) => sum + t.amount, 0) * -1
            ).toFixed(2)
          );
        });

        const averageMonthly = parseFloat(
          (months.reduce((sum, m) => sum + m, 0) / 12).toFixed(2)
        );

        return {
          ...cat,
          usedThisMonth,
          averageMonthly,
        };
      });

      setCategories(enriched);
    }

    fetchCategories();
  }, [userId, transactions]);


  const handleLimitChange = (id: number, value: string) => {
    const numeric = parseFloat(value.replace(/\D/g, "")) || 0;
    setEditingLimits((prev) => ({ ...prev, [id]: numeric }));
  };

  const handleIconChange = (id: number, url: string) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, iconUrl: url } : cat))
    );
  };

  const handleSave = async () => {
    try {
      const updatedCategories = categories.map((cat) => {
        const newLimit = editingLimits[cat.id] ?? cat.monthlyLimit ?? 0;
        return { ...cat, monthlyLimit: newLimit };
      });

      for (const cat of updatedCategories) {
        await fetch("/api/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: cat.id,
            category: cat.category,
            monthlyLimit: cat.monthlyLimit,
            iconUrl: cat.iconUrl,
          }),
        });
      }

      setCategories(updatedCategories); // atualiza o estado local
      setEditingLimits({}); // limpa os inputs
      alert("Limites e ícones salvos com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar");
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          category: newCategory,
          monthlyLimit: 0,
          iconUrl: ICON_OPTIONS[0].value, // padrão (💰
        }),
      });
      const data = await res.json();
      setCategories((prev) => [
        ...prev,
        { ...data.category, averageMonthly: 0, usedThisMonth: 0 },
      ]);
      setNewCategory("");
    } catch (err) {
      console.error(err);
      alert("Erro ao adicionar categoria");
    }
  };

  // Soma total dos limites do usuário
  const totalLimits = categories.reduce(
    (sum, cat) => sum + Number(editingLimits[cat.id] ?? cat.monthlyLimit ?? 0),
    0
  );

  // Soma total dos limites do usuário
  const usedLimits = categories.reduce(
    (sum, cat) => sum + (cat.usedThisMonth > 0 ? cat.usedThisMonth : 0),
    0
  );


  // Soma total dos gastos médios das categorias
  const averageLimits = categories.reduce(
    (sum, cat) => sum + (cat.averageMonthly > 0 ? cat.averageMonthly : 0),
    0
  );

  return (
    <div style={{ padding: "", maxWidth: "", margin: "0 auto" }}>
      <h3>Planejamento Financeiro</h3>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}></th>
            <th style={{ textAlign: "left" }}>Categoria</th>
            <th style={{ textAlign: "left" }}>Editar Limite</th>
            <th>Usado no mês</th>
            <th>Limite Mensal</th>
            <th>Média Mensal</th>
            <th>{/* Coluna para o seletor de ícones */}</th>
            <th>{/* Coluna para o botão de deletar */}</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => {
            const limitValue = editingLimits[cat.id] ?? cat.monthlyLimit ?? 0;
            return (
              <tr key={cat.id} style={{ borderBottom: "1px solid #ccc" }}>
                <td style={{ textAlign: "center", fontSize: "20px" }}>
                  {cat.iconUrl ?? ICON_OPTIONS[0].value}
                </td>
                <td style={{ maxWidth: "125px" }}>{cat.category}</td>
                <td style={{ maxWidth: "125px" }}>
                  R$
                  <input
                    style={{ maxWidth: "70px" }}
                    type="text"
                    value={limitValue}
                    onChange={(e) => handleLimitChange(cat.id, e.target.value)}
                  />{" "}
                </td>
                <td style={{ maxWidth: "50px" }}>  R$ {cat.usedThisMonth.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} </td>
                <td style={{ maxWidth: "100px" }}>
                  <div style={{ background: "#eee", width: "100%", height: 12, borderRadius: 6 }}>
                    <div
                      style={{
                        width: `${Math.min((cat.usedThisMonth / (limitValue || 1)) * 100, 100)}%`,
                        background: cat.usedThisMonth > (limitValue ?? 0) ? "red" : "#388e3c",
                        height: 12,
                        borderRadius: 6,
                      }}
                    />
                  </div>
                  <small>
                    R$ {cat.usedThisMonth.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} /{" "}
                    {limitValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </small>
                </td>
                <td style={{ maxWidth: "100px" }}>
                  <div style={{ background: "#eee", width: "100%", height: 12, borderRadius: 6 }}>
                    <div
                      style={{
                        width: `${Math.min(
                          (cat.averageMonthly / ((editingLimits[cat.id] ?? cat.monthlyLimit) || 1)) * 100,
                          100
                        )}%`,
                        background:
                          cat.averageMonthly > ((editingLimits[cat.id] ?? cat.monthlyLimit) || 0)
                            ? "red"
                            : "#7c2ea0",
                        height: 12,
                        borderRadius: 6,
                      }}
                    />
                  </div>
                  <small>
                    R$ {cat.averageMonthly.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} /{" "}
                    {limitValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </small>
                </td>
                <td>
                  <select
                    value={cat.iconUrl ?? ""}
                    onChange={(e) => handleIconChange(cat.id, e.target.value)}
                  >
                    {ICON_OPTIONS.map((ico) => (
                      <option key={ico.label} value={ico.value}>
                        {ico.label}
                      </option>
                    ))}
                  </select>
                </td>
                {/* Nova coluna para deletar categoria */}
                <td>
                  <button
                    style={{
                      backgroundColor: "red",
                      color: "white",
                      border: "none",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                    onClick={async () => {
                      if (!confirm(`Deseja realmente remover a categoria "${cat.category}"?`)) return;

                      try {
                        const res = await fetch(`/api/categories?id=${cat.id}&userId=${userId}`, {
                          method: "DELETE",
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setCategories((prev) => prev.filter((c) => c.id !== cat.id));
                          alert(data.message);
                        } else {
                          alert(data.error);
                        }
                      } catch (err) {
                        console.error(err);
                        alert("Erro ao remover categoria");
                      }
                    }}
                  >
                    X
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: "bold", borderTop: "2px solid #000" }}>
            <td></td>

            <td style={{ maxWidth: "125px" }}>Gastos totais planejados</td>
            <td>R$ {totalLimits.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} </td>
            <td>R$ {usedLimits.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} </td>
            <td> <div style={{ background: "#eee", width: "100%", height: 12, borderRadius: 6 }}>
              <div
                style={{
                  width: `${Math.min((usedLimits / (totalLimits || 1)) * 100, 100)}%`,
                  background: usedLimits > totalLimits ? "red" : "#388e3c",
                  height: 12,
                  borderRadius: 6,
                }}
              />
            </div>
              <small>
                R$ {usedLimits.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} /{" "}
                R$ {totalLimits.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </small></td>
            <td>
              <div style={{ background: "#eee", width: "100%", height: 12, borderRadius: 6, marginTop: 4 }}>
                <div
                  style={{
                    width: `${Math.min((usedLimits / (averageLimits || 1)) * 100, 100)}%`,
                    background: usedLimits > averageLimits ? "red" : "#7c2ea0",
                    height: 12,
                    borderRadius: 6,
                  }}
                />
              </div>
              <small>
                R$ {usedLimits.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} /{" "}
                R$ {averageLimits.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </small>
            </td>
            <td colSpan={3}></td>
          </tr>
        </tfoot>
      </table>

      <div style={{ marginTop: "1rem" }}>

        <button style={{
          marginBottom: "1rem",
          backgroundColor: "#7c2ea0",
          color: "white",
          padding: "0.5rem 1rem",
          borderRadius: "6px",
          cursor: "pointer",
          marginLeft: "1rem",
        }}
          onClick={() => handleSave()}>
          Salvar Limites Mensais
        </button>
        <br></br>
        <input
          type="text"
          placeholder="Nova categoria"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          style={{ marginRight: "0.5rem" }}
        />
        <button style={{
          marginBottom: "1rem",
          backgroundColor: "#7c2ea0",
          color: "white",
          padding: "0.5rem 1rem",
          borderRadius: "6px",
          cursor: "pointer",
          marginLeft: "1rem",
        }}
          onClick={() => handleAddCategory()}>Adicionar Categoria</button>
      </div>
    </div>
  );
};

export default PlanningTab;
