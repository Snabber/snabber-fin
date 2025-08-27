"use client";
import type { Transaction } from "../types/transaction";
import React from "react";

type Props = {
  files: File[];
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onProcessFiles: () => void;
};

export default function UploadTab({ files, onDrop, onDragOver, onProcessFiles }: Props) {
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
            onClick={onProcessFiles}
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
