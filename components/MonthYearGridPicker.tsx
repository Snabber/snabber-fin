"use client";
import { useState, useEffect, useRef } from "react";

interface Props {
  year: number;
  month: number | "Todos";
  onChange: (year: number, month: number | "Todos") => void;
}

export default function MonthYearGridPicker({ year, month, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const months = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];

  const handleSelect = (m: number | "Todos") => {
    onChange(year, m);
    setOpen(false);
  };

  // Fecha se clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const monthLabel = month === "Todos" ? "Todos" : months[month as number];

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      {/* Botão compacto */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: "0.6rem 1.2rem",
          borderRadius: "12px",
          border: "1px solid #ccc",
          backgroundColor: "white",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          fontFamily: "andromeda-bold-webfont, sans-serif",
          color: "#7c2ea0",
          fontSize: "1rem",
        }}
      >
        {monthLabel} / {year}
      </button>

      {/* Modal flutuante */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "110%",
            left: 0,
            zIndex: 10,
            padding: "1rem",
            borderRadius: "16px",
            backgroundColor: "white",
            boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
            textAlign: "center",
            width: "260px",
          }}
        >
          {/* Stepper do ano */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
            }}
          >
            <button
              onClick={() => onChange(year - 1, month)}
              style={{
                padding: "0.3rem 0.8rem",
                borderRadius: "8px",
                backgroundColor: "#f1f1f1",
                border: "none",
                cursor: "pointer",
              }}
            >
              ◀
            </button>
            <span
              style={{
                fontWeight: "bold",
                fontSize: "1.2rem",
                color: "#7c2ea0",
              }}
            >
              {year}
            </span>
            <button
              onClick={() => onChange(year + 1, month)}
              style={{
                padding: "0.3rem 0.8rem",
                borderRadius: "8px",
                backgroundColor: "#f1f1f1",
                border: "none",
                cursor: "pointer",
              }}
            >
              ▶
            </button>
          </div>

          {/* Grade de meses */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "0.5rem",
            }}
          >
            <button
              onClick={() => handleSelect("Todos")}
              style={{
                padding: "0.5rem",
                borderRadius: "10px",
                border: "1px solid #ccc",
                backgroundColor: month === "Todos" ? "#7c2ea0" : "#f1f1f1",
                color: month === "Todos" ? "white" : "#383838",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Todos
            </button>
            {months.map((m, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                style={{
                  padding: "0.5rem",
                  borderRadius: "10px",
                  border: "1px solid #ccc",
                  backgroundColor:
                    month === idx ? "#7c2ea0" : "white",
                  color: month === idx ? "white" : "#383838",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    month === idx ? "#7c2ea0" : "#f98c39")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    month === idx ? "#7c2ea0" : "white")
                }
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
