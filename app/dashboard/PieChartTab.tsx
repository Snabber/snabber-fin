"use client";
import type { Transaction } from "../types/transaction";

import { Pie } from "react-chartjs-2";
import { useMemo } from "react";

type Props = {
  transactions: Transaction[];
};

export default function PieChartTab({ transactions }: Props) {
  const pieData = useMemo(() => {
    const gastosPorCategoria: { [cat: string]: number } = {};
    transactions.forEach((t) => {
      if (t.amount < 0 && t.category !== "Ignorado") {
        gastosPorCategoria[t.category] =
          (gastosPorCategoria[t.category] || 0) + Math.abs(Number(t.amount));
      }
    });

    // Ordena categorias e pega só as 20 primeiras
    const categoriasOrdenadas = Object.entries(gastosPorCategoria)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    const labels = categoriasOrdenadas.map(([cat]) => cat);
    const valores = categoriasOrdenadas.map(([_, val]) => val);

    // Paleta de cores grande (25 cores)
    const colors = [
      "#7c2ea0", "#f98c39", "#388e3c", "#d32f2f", "#36A2EB",
      "#FF6384", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40",
      "#8E44AD", "#2ECC71", "#3498DB", "#E74C3C", "#F39C12",
      "#1ABC9C", "#9B59B6", "#34495E", "#16A085", "#27AE60",
      "#2980B9", "#D35400", "#7F8C8D", "#C0392B", "#95A5A6"
    ];

    return {
      labels,
      datasets: [
        {
          data: valores,
          backgroundColor: colors.slice(0, categoriasOrdenadas.length),
        },
      ],
    };
  }, [transactions]);

  return (
    <div style={{ maxWidth: "400px", margin: "2rem auto" }}>
      <h3 style={{ textAlign: "center", color: "#7c2ea0", marginBottom: "0.5rem" }}>
        Gastos por Categoria
      </h3>
      <Pie data={pieData} />
    </div>
  );
}
