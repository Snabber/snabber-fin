// app/api/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import mysql from "mysql2/promise";

// Crie o pool se ainda não tiver
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

const transactions: any[] = [];


// Função auxiliar para converter data Excel (número) para JS Date
function excelToDate(value: any): Date | "Skip" {
    if (!value) return "Skip";

    // Caso seja número (Excel serial)
    if (typeof value === "number") {
        // Excel serial para JS Date (considerando 1900-based)
        const date = new Date(Math.round((value - 25569) * 86400 * 1000));
        return date;
    }

    // Caso seja string
    if (typeof value === "string") {
        value = value.trim();

        // Se for formato "dd/MM"
        const dmMatch = /^(\d{2})\/(\d{2})$/.exec(value);
        if (dmMatch) {
            const day = parseInt(dmMatch[1], 10);
            const month = parseInt(dmMatch[2], 10) - 1; // JS: 0-indexed
            const year = new Date().getFullYear();
            return new Date(year, month, day);
        }

        // Se for formato "dd/MM/yyyy"
        const dmyMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
        if (dmyMatch) {
            const day = parseInt(dmyMatch[1], 10);
            const month = parseInt(dmyMatch[2], 10) - 1;
            const year = parseInt(dmyMatch[3], 10);
            return new Date(year, month, day);
        }

        const dmy2Match = /^(\d{2})\/(\d{2})\/(\d{2})$/.exec(value);
        if (dmy2Match) {
            const day = parseInt(dmy2Match[1], 10);
            const month = parseInt(dmy2Match[2], 10) - 1;
            const year = parseInt(dmy2Match[3], 10)+2000;
            return new Date(year, month, day);
        }

        // Outros casos não reconhecidos
        return "Skip";
    }

    return "Skip";
}
// Função mock para adivinhar categoria
async function guessCategory(comment: string, description: string, userId: number): Promise<string> {
  if (!comment) comment = "QualquerCoisa";

  const conn = await pool.getConnection();

  try {
    const sql = `
      SELECT DISTINCT category, MAX(date) as md, COUNT(category) as ct, 1 as Priority
      FROM money_transactions
      WHERE user_id = ? AND category <> '' AND (comment LIKE ? OR description LIKE ?)
      GROUP BY category
      UNION
      SELECT DISTINCT category, MAX(date) as md, COUNT(category) as ct, 2 as Priority
      FROM money_transactions
      WHERE user_id = ? AND category <> '' AND (comment LIKE ? OR description LIKE ?)
      GROUP BY category
      UNION
      SELECT DISTINCT category, MAX(date) as md, COUNT(category) as ct, 3 as Priority
      FROM money_transactions
      WHERE user_id = ? AND category <> '' AND (comment LIKE ? OR description LIKE ?)
      GROUP BY category
      ORDER BY Priority, ct DESC, md DESC;
    `;

    const params = [
      userId,
      comment.substring(0, 9) + "%",
      description.substring(0, 9) + "%",
      userId,
      comment.substring(0, 6) + "%",
      description.substring(0, 6) + "%",
      userId,
      comment.substring(0, 3) + "%",
      description.substring(0, 3) + "%",
    ];

    const [rows] = await conn.query(sql, params);
    const categories = (rows as any[]).map(r => r.category);

    return categories.length > 0 ? categories[0] : "To be Defined";
  } catch (err) {
    console.error(err);
    return "To be Defined";
  } finally {
    conn.release();
  }
}

async function parseBankTransactions(
    jsonData: any[][],
    colDate: number,
    colDesc: number,
    colValSpent: number,
    colValEarned: number,
    colComment: number,
    source: string,
    userId: number,
    transactions: any[]
) {
    console.log(`Importando ${source} XLS`);

    // Define a linha inicial, você pode parametrizar se quiser
    let startRow = 10;
    for (let row = startRow; row < jsonData.length; row++) {
        const rowData = jsonData[row];

        const dateRaw = rowData[colDate];
        const descriptionRaw = rowData[colDesc];
        let amountRaw = rowData[colValSpent];
        const comment = rowData[colComment] || "";

        console.log(`ColValSpent "${ rowData[colValSpent]}" XLS`);
        console.log(`ColValEarned "${ rowData[colValEarned]}" XLS`);

        if (!descriptionRaw || descriptionRaw === "SALDO ANTERIOR" || descriptionRaw === "Total do Dia") {
            continue;
        }

        const dateXl = excelToDate(dateRaw);
        if (dateXl === "Skip") continue;

        const dateNew = dateXl.toISOString().slice(0, 10); // YYYY-MM-DD

        if (amountRaw != null &&  amountRaw != " " && amountRaw != ""){
            console.log(`RAW ${amountRaw} RAW`);
            
            if (Number(String(amountRaw).replace(",", ".")) > 0) {
                amountRaw =  Number(String(amountRaw).replace(",", ".")) * -1; 
                console.log(`RAWFixed ${amountRaw} RAW`);
            }
            

        } else amountRaw = rowData[colValEarned];

        //console.log(`ElseIf ${amountRaw} RAW`);
        let amount = String(amountRaw).replace(",", ".");
        console.log(`------------`);
        

        const description = `${descriptionRaw} ${comment}`;
        const category = await guessCategory(comment, description, userId);

        transactions.push({
            date: dateNew,
            description,
            amount: Number(amount),
            comment,
            account: source,
            userId,
            category,
        });
    }
}

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get("content-type") || "";
        if (!contentType.includes("multipart/form-data")) {
            return new NextResponse("Expected multipart/form-data", { status: 400 });
        }

        const formData = await req.formData();
        const files = formData.getAll("files") as any[];
        const userId = Number(formData.get("userId") || 0);

        

        for (const file of files) {
            const name = file.name.toLowerCase();
            const arrayBuffer = await file.arrayBuffer();

            if (name.endsWith(".xls") || name.endsWith(".xlsm")) {
                const workbook = XLSX.read(arrayBuffer, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];
                console.log("XLS VA2" + jsonData[7][0]);

                // Detecta se é Amex pela célula 0,10
                if (jsonData[7][0] === "Data") {

                    parseBankTransactions(jsonData, 0, 1, 4, 3, 2, "Bradesco", userId, transactions);
                }
                else if (jsonData[1][2] === "Bradesco Internet Banking"){
                    parseBankTransactions(jsonData, 0, 1, 4, 4, 2, "Amex", userId, transactions);

                }







            }
        }

        console.log("Transactions parsed:", transactions);

        
        for (const tx of transactions) {
            try {
                const [result] = await pool.query(
                    `INSERT INTO money_transactions 
        (date, description, amount, category, comment, user_id, account) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        tx.date,
                        tx.description,
                        tx.amount,
                        tx.category,
                        tx.comment,
                        tx.userId,
                        tx.account,
                    ]
                );
                console.log("Inserted transaction ID:", (result as any).insertId);
            } catch (err) {
                console.error("Error inserting transaction:", tx, err);
            }
        }

        return NextResponse.json({ success: true, transactions });
    } catch (err) {
        console.error(err);
        return new NextResponse("Error processing files", { status: 500 });
    }


}
