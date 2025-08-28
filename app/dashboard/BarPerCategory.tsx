"use client";
import { useEffect, useMemo, useState } from "react";
import type { Transaction } from "../types/transaction";
import { FolderKanban } from "lucide-react";

interface BarPerCategoryProps {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  userId: number;
  month: string; // 0=jan, 11=dez, ou "Todos"
  year: string;
}

interface UserCategory {
  id: number;
  category: string;
  monthlyLimit: number | null;
  icon_url?: string; // ícone salvo como string (emoji/caractere)
  iconUrl?: string;  // compat: caso a API use camelCase
}

type Row = {
  category: string;
  soma: number;
  media: number;
  limit: number | null;
  icon?: string | null;
};

const monthsList = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const BarPerCategory: React.FC<BarPerCategoryProps> = ({ transactions, filteredTransactions, userId, month, year }) => {
  const [categories, setCategories] = useState<UserCategory[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>({
  key: "soma",
  direction: "desc",
});

  useEffect(() => {
    async function fetchCategories() {
      const res = await fetch(`/api/categories?userId=${userId}`);
      const data = await res.json();
      setCategories(data.categories);
    }
    fetchCategories();
  }, [userId]);

  const currentYear = Number(year);
  const currentMonth = month === "Todos" ? -1 : monthsList.findIndex((m) => m === month);

  // soma total filtrada (ignorando "Ignorado")
  const totalGasto = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.category.toLowerCase() !== "ignorado")
      .filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === currentYear && (currentMonth === -1 || d.getMonth() === currentMonth);
      })
      .reduce((sum, t) => sum + (t.amount < 0 ? -t.amount : 0), 0);
  }, [filteredTransactions, currentYear, currentMonth]);

  // dados por categoria
  const dataByCategory: Row[] = useMemo(() => {
    const grouped = new Map<string, Row>();

    // Soma do período filtrado
    for (const t of filteredTransactions) {
      if (!t.category || t.category.toLowerCase() === "ignorado") continue;
      const d = new Date(t.date);
      if (d.getFullYear() !== currentYear) continue;
      if (currentMonth !== -1 && d.getMonth() !== currentMonth) continue;
      const amount = t.amount < 0 ? -t.amount : 0;
      if (!grouped.has(t.category)) {
        grouped.set(t.category, { category: t.category, soma: 0, media: 0, limit: null, icon: null });
      }
      grouped.get(t.category)!.soma += amount;
    }

    // Média anual, limite e ícone
    const now = new Date();
    const divisor = currentYear === now.getFullYear() ? now.getMonth() + 1 : 12;

    for (const [cat, row] of grouped.entries()) {
      const yearTransactions = transactions.filter(
        (t) => t.category === cat && new Date(t.date).getFullYear() === currentYear
      );
      const somaAno = yearTransactions.reduce((s, t) => s + (t.amount < 0 ? -t.amount : 0), 0);
      row.media = somaAno / (divisor || 1);

      const catInfo = categories.find((c) => c.category === cat);
      row.limit = catInfo?.monthlyLimit ?? null;
      row.icon = (catInfo?.icon_url ?? catInfo?.iconUrl ?? null) as string | null; // <- pega o ícone string
    }

    return Array.from(grouped.values());
  }, [filteredTransactions, transactions, categories, currentYear, currentMonth]);

  // ordenação
  const sortedData = useMemo(() => {
    let sortable = [...dataByCategory];
    if (sortConfig) {
      sortable.sort((a: any, b: any) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortable;
  }, [dataByCategory, sortConfig]);

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // filtro
  const filteredData = useMemo(() => {
    return sortedData.filter((item) =>
      Object.keys(filters).every((key) =>
        String((item as any)[key])
          .toLowerCase()
          .includes((filters[key] || "").toLowerCase())
      )
    );
  }, [sortedData, filters]);

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <h3>Barras por Categoria</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
        <thead>
          <tr>
            {[
              { key: "category", label: "Categoria" },
              { key: "soma", label: "Soma Gasta" },
              { key: "percentual", label: "% do Total" },
              { key: "media", label: "Média Anual" },
              { key: "limit", label: "Limite Máximo" },
            ].map((col) => (
              <th
                key={col.key}
                style={{ cursor: "pointer", borderBottom: "1px solid #ccc" }}
                onClick={() => requestSort(col.key)}
              >
                {col.label}
                <div>
                  <input
                    type="text"
                    placeholder="filtrar"
                    value={filters[col.key] || ""}
                    onChange={(e) => setFilters({ ...filters, [col.key]: e.target.value })}
                    style={{ width: "90%" }}
                  />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row) => {
            const percentual = totalGasto > 0 ? (row.soma / totalGasto) * 100 : 0;
            return (
              <tr key={row.category} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {row.icon ? (
                    <span aria-hidden style={{ fontSize: 18, lineHeight: 1 }}>{row.icon}</span>
                  ) : (
                    <FolderKanban size={16} />
                  )}
                  {row.category}
                </td>
                <td>R$ {row.soma.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                <td>
                  <div style={{ background: "#eee", width: "100%", height: 12, borderRadius: 6 }}>
                    <div
                      style={{
                        width: `${percentual.toFixed(2)}%`,
                        background: "#388e3c",
                        height: 12,
                        borderRadius: 6,
                      }}
                    />
                  </div>
                  <small>{percentual.toFixed(2)} %</small>
                </td>
                <td>R$ {row.media.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
<td>{row.limit !== null ? `R$ ${row.limit.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}</td>

              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BarPerCategory;