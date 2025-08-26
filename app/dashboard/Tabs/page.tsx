"use client"; // necessário para usar useState

import { useState } from "react";

export default function TabsComponent() {
  const [activeTab, setActiveTab] = useState<"pie" | "transactions" | "upload">("pie");

  const tabStyle = (tab: "pie" | "transactions" | "upload") => ({
    padding: "10px 20px",
    cursor: "pointer",
    borderBottom: activeTab === tab ? "2px solid #007bff" : "2px solid transparent",
    color: activeTab === tab ? "#007bff" : "#555",
    fontWeight: activeTab === tab ? 600 : 400,
    transition: "all 0.3s ease",
  });

  return (
    <div>
      <div style={{ display: "flex", marginBottom: "1rem" }}>
        <div style={tabStyle("pie")} onClick={() => setActiveTab("pie")}>Gráfico PIE</div>
        <div style={tabStyle("transactions")} onClick={() => setActiveTab("transactions")}>Transação</div>
        <div style={tabStyle("upload")} onClick={() => setActiveTab("upload")}>Upload CSV</div>
      </div>

      <div>
        {activeTab === "pie" && <div>Conteúdo do PIE</div>}
        {activeTab === "transactions" && <div>Conteúdo das Transações</div>}
        {activeTab === "upload" && <div>Conteúdo de Upload</div>}
      </div>
    </div>
  );
}
