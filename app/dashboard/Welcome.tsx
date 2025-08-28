// Dashboard/Welcome.tsx
"use client";

import React from "react";

export default function Welcome() {
  return (
    <div
      style={{
        position: "relative",
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "3rem",
        textAlign: "center",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        color: "#383838",
        overflow: "hidden",
      }}
    >
      {/* Imagem de fundo com transparência */}
      <img
        src="/img/Logo_Cinza.png"
        alt="Logo cinza"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "60%",
          height: "auto",
          opacity: 0.1, // 40% transparência
          pointerEvents: "none", // não interfere nos cliques
        }}
      />

      <h2
        style={{
          position: "relative",
          fontFamily: "andromeda-bold-webfont, sans-serif",
          fontSize: "2rem",
          marginBottom: "1rem",
          color: "#7c2ea0",
        }}
      >
        Bem-vindo!
      </h2>

      <p
        style={{
          position: "relative",
          fontSize: "1.2rem",
          marginBottom: "1.5rem",
          color: "#383838",
        }}
      >
        Para começar, adicione uma transação clicando em{" "}
        <span style={{ color: "#f98c39", fontWeight: "bold" }}>Adicionar</span>{" "}
        ou importe um arquivo <strong>TXT</strong>, <strong>CSV</strong> ou{" "}
        <strong>XML</strong> compatível.
      </p>

      <p
        style={{
          position: "relative",
          fontSize: "1rem",
          color: "#7c2ea0",
          fontStyle: "italic",
        }}
      >
        Sua jornada financeira começa aqui 🚀
      </p>

      {/* Fonte Andromeda (ajuste o caminho se necessário, ex.: /andromeda-bold-webfont.woff2) */}
      
    </div>
  );
}
