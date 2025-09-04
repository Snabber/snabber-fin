"use client";
import Link from "next/link";
import type { Transaction } from "../types/transaction";
import React, { useEffect, useState } from "react";
import type { BankParseParam } from "../types/bank_params";

type Props = {
  files: File[];
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onProcessFiles: (paramId: number) => void;
};

export default function UploadTab({ files, onDrop, onDragOver, onProcessFiles }: Props) {
  const [bankParams, setBankParams] = useState<BankParseParam[]>([]);
  const [selectedParamId, setSelectedParamId] = useState<number>(0); // 0 = Padrão

  useEffect(() => {
    // Carrega os bank params do backend
    fetch("/api/bank-params")
      .then((res) => res.json())
      .then((data) => setBankParams(data))
      .catch(console.error);
  }, []);

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      style={{
        border: "2px dashed #7c2ea0",
        borderRadius: "8px",
        padding: "2rem",
        textAlign: "center",
        marginBottom: "1.5rem",
        backgroundColor: "#fff",
      }}
    >
      {/* Link para voltar ao painel */}
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/admin-panel" style={{ color: "#7c2ea0", fontWeight: "bold" }}>
          Painel Admin
        </Link>
      </div>

      {/* Dropdown de fontes */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontWeight: "bold", marginRight: "0.5rem" }}>Source:</label>
        <select
          value={selectedParamId}
          onChange={(e) => setSelectedParamId(Number(e.target.value))}
          style={{ padding: "0.4rem 0.6rem", borderRadius: "4px" }}
        >
          <option value={0}>Padrão</option> {/* opção padrão selecionada */}
          {bankParams.map((param) => (
            <option key={param.id} value={param.id}>
              {param.source}
            </option>
          ))}
        </select>
      </div>

      <p>Arraste arquivos .txt ou .csv aqui</p>
      <p style={{ fontSize: "0.9rem", color: "#666" }}>
        (Você pode soltar múltiplos arquivos)
      </p>

      {/* Lista de arquivos carregados */}
      {files.length > 0 && (
        <div style={{ marginTop: "1rem", textAlign: "left" }}>
          <strong>Arquivos carregados:</strong>
          <ul>
            {files.map((f, i) => (
              <li key={i}>{f.name}</li>
            ))}
          </ul>
          <button
            onClick={() => onProcessFiles(selectedParamId)}
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
  );
}
