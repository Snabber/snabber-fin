"use client";
import { Bar } from "react-chartjs-2";
import { useMemo } from "react";
import type { Transaction } from "@/types/transaction";

const monthsList = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

type Props = {
  transactions: Transaction[];
};

export default function BarChartTab({ transactions }: Props) {
  const barData = useMemo(() => {
    const monthlyData: { [month: number]: { entradas: number; saidas: number } } = {};
    for (let i = 0; i < 12; i++) {
      monthlyData[i] = { entradas: 0, saidas: 0 };
    }

    transactions.forEach((t) => {
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
          backgroundColor: "#388e3c",
        },
        {
          label: "Saídas",
          data: monthsList.map((_, i) => monthlyData[i].saidas),
          backgroundColor: "#d32f2f",
        },
      ],
    };
  }, [transactions]);

  return (
    <div style={{ maxWidth: "800px", margin: "2rem auto" }}>
      <h3 style={{ textAlign: "center", color: "#7c2ea0", marginBottom: "0.5rem" }}>
        Entradas e Saídas por Mês
      </h3>
      <Bar data={barData} />
    </div>
  );
}
