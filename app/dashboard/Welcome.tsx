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
          opacity: 0.1,
          pointerEvents: "none",
        }}
      />

      <h2
        style={{
          position: "relative",
          fontFamily: "andromeda-bold-webfont, sans-serif",
          fontSize: "2rem",
          marginBottom: "1.5rem",
          color: "#7c2ea0",
        }}
      >
        📂 Baixe o modelo de Excel
      </h2>

      <p
        style={{
          position: "relative",
          fontSize: "1.2rem",
          marginBottom: "2rem",
          color: "#383838",
        }}
      >
        Use o modelo abaixo para importar suas transações:
      </p>

      <a
        href="/files/modeloSnabber.xlsx"
        download
        style={{
          position: "relative",
          display: "inline-block",
          padding: "0.8rem 2rem",
          borderRadius: "12px",
          backgroundColor: "#7c2ea0",
          color: "white",
          fontWeight: "bold",
          fontSize: "1.1rem",
          textDecoration: "none",
          boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
          transition: "all 0.2s ease",
        }}
        onMouseOver={(e) =>
          ((e.target as HTMLElement).style.backgroundColor = "#5b1f77")
        }
        onMouseOut={(e) =>
          ((e.target as HTMLElement).style.backgroundColor = "#7c2ea0")
        }
      >
        ⬇️ Download modeloSnabber.xlsx
      </a>

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
    </div>
  );
}
