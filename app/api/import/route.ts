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

        // Se for formato "d/MM/yyyy"
        const dmy3Match = /^(\d{1})\/(\d{2})\/(\d{4})$/.exec(value);
        if (dmy3Match) {
            const day = parseInt(dmy3Match[1], 10);
            const month = parseInt(dmy3Match[2], 10) - 1;
            const year = parseInt(dmy3Match[3], 10);
            return new Date(year, month, day);
        }

        // Se for formato "dd/MM/yy"
        const dmy2Match = /^(\d{2})\/(\d{2})\/(\d{2})$/.exec(value);
        if (dmy2Match) {
            const day = parseInt(dmy2Match[1], 10);
            const month = parseInt(dmy2Match[2], 10) - 1;
            const year = parseInt(dmy2Match[3], 10) + 2000;
            return new Date(year, month, day);
        }

        // Se for formato yyyy-MM-dd
        const ymdMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
        if (ymdMatch) {
            const year = parseInt(ymdMatch[1], 10);
            const month = parseInt(ymdMatch[2], 10) - 1;
            const day = parseInt(ymdMatch[3], 10);
            return new Date(year, month, day);
        }

        // Se for formato "dd-mmm-yy" (ex: 12-ago-25)
        const dmmmyMatch = /^(\d{2})-([a-z]{3})-(\d{2})$/i.exec(value);
        if (dmmmyMatch) {
            const day = parseInt(dmmmyMatch[1], 10);
            const monthStr = dmmmyMatch[2].toLowerCase();

            // Mapeamento de abreviações de meses para índice (0-11)
            const monthMap: { [key: string]: number } = {
                jan: 0,
                fev: 1,
                mar: 2,
                abr: 3,
                mai: 4,
                jun: 5,
                jul: 6,
                ago: 7,
                set: 8,
                out: 9,
                nov: 10,
                dez: 11,
            };

        const month = monthMap[monthStr];
        if (month === undefined) return "Skip";;

        const year = parseInt(dmmmyMatch[3], 10) + 2000;
        
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
    removeDots: boolean,
    transactions: any[],
    startRow: number = 10,
    changeSignal: boolean = true,
    colCategory: string = "To be Defined" 
) {
    console.log(`Importando ${source} XLS`);


    // Define a linha inicial, você pode parametrizar se quiser
    
    for (let row = startRow; row < jsonData.length; row++) {
        const rowData = jsonData[row];

        const dateRaw = rowData[colDate];
        const descriptionRaw = rowData[colDesc];
        let amountRaw = rowData[colValSpent];
        const comment = rowData[colComment] || "";
        let valSource = source;
        let valCategory = rowData[Number(colCategory)];
        if (valSource.length < 2) {
           valSource = rowData[Number(source)];
        }
        //console.log(`ColValSpent "${rowData[colValSpent]}" XLS`);
        //console.log(`ColValEarned "${rowData[colValEarned]}" XLS`);
        console.log(`0_ ${dateRaw} | ${descriptionRaw} | ${amountRaw} | ${comment} | ${source} | ${valSource}`);

        if (!descriptionRaw || descriptionRaw === "SALDO ANTERIOR" || descriptionRaw === "Total do Dia") {
            continue;
        }

        console.log(`DateRaw "${dateRaw}" XLS`);
        const dateXl = excelToDate(dateRaw);

        console.log(`0.1_Date "${dateXl}" XLS`);

        console.log(`2_ ${dateXl} | ${descriptionRaw} | ${amountRaw} | ${comment}  | ${valSource}`);

        if (dateXl === "Skip") continue;
        const dateNew = dateXl.toISOString().slice(0, 10); // YYYY-MM-DD
        console.log(`3_ ${dateNew} | ${descriptionRaw} | ${amountRaw} | ${comment}`);

        if (amountRaw != null && amountRaw != " " && amountRaw != "") { //vem do colValSpent
            if (removeDots) amountRaw = String(amountRaw).replace(/\./g, "");
            
            console.log(`4_ ${dateNew} | ${descriptionRaw} | ${amountRaw} | ${comment}`);
            if (Number(String(amountRaw).replace(",", ".")) > 0) {
                if(changeSignal){
                    amountRaw = Number(String(amountRaw).replace(",", ".")) * -1;
                    console.log(`5_ ${dateNew} | ${descriptionRaw} | ${amountRaw} | ${comment}`);
                }
            }


        } else { //vem do colValEarned
            amountRaw = rowData[colValEarned];
            console.log(`6_ ${dateNew} | ${descriptionRaw} | ${amountRaw} | ${comment}`);
            if (removeDots) amountRaw = String(amountRaw).replace(/\./g, "");
            console.log(`7_ ${dateNew} | ${descriptionRaw} | ${amountRaw} | ${comment}`);
        }

        console.log(`ElseIf ${amountRaw} RAW`);
        console.log(`8_ ${dateXl} | ${descriptionRaw} | ${amountRaw} | ${comment}  | ${valSource}`);
        let amount = String(amountRaw).replace(",", ".");

        console.log(`9_ ${dateXl} | ${descriptionRaw} | ${amountRaw} | ${comment}  | ${valSource}`);
        
        const description = `${descriptionRaw} ${comment}`;
        

        var category = await guessCategory(comment, description, userId);

        if(colCategory !== "To be Defined"){
           category = rowData[Number(colCategory)]; 
        }

        console.log(`10_ ${dateNew} | ${description} | ${amount} | ${comment}  | ${valSource} | ${category}`);

        transactions.push({
            date: dateNew,
            description,
            amount: Number(amount),
            comment,
            account: valSource,
            userId,
            category,
        });

        console.log(`11_ Transaction Count: ${transactions.length}`);

        console.log(`-`);
    }
}

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get("content-type") || "";
        if (!contentType.includes("multipart/form-data")) {
            return new NextResponse("Expected multipart/form-data", { status: 400 });
        }
        transactions.length = 0;

        const formData = await req.formData();
        const files = formData.getAll("files") as any[];
        const userId = Number(formData.get("userId") || 0);

        
        for (const file of files) {
            const name = file.name.toLowerCase();
            const arrayBuffer = await file.arrayBuffer();

            if (name.endsWith(".xls") || name.endsWith(".xlsm") || name.endsWith(".xlsx")) {
                const workbook = XLSX.read(arrayBuffer, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];
                console.log("XLS VA2" + jsonData[7][0]);

                // BRADESCO
                if (jsonData[7][0] === "Data") {
                    await  parseBankTransactions(jsonData, 0, 1, 4, 3, 2, "Bradesco", userId, true, transactions);
                }
                // AMEX
                else if (jsonData[1][2] === "Bradesco Internet Banking") {
                    await parseBankTransactions(jsonData, 0, 1, 4, 4, 2, "Amex", userId, false, transactions);
                }
                else{
                    await parseBankTransactions(jsonData, 0, 1, 2, 2, 4, "5", userId, false, transactions, 2, false, "3");
                }

            }
            else if (name.endsWith(".csv")) {
                const text = await file.text();
                const lines = text.split(/\r?\n/).filter((l: string) => l.trim() !== "");
                const jsonData: any[][] = lines.map((line: string) => {
                    // Separar por vírgula, mas considerando aspas
                    const regex = /(".*?"|[^",]+)(?=\s*,|\s*$)/g;
                    const matches = line.match(regex);
                    return matches ? matches.map((m: string) => m.replace(/^"(.*)"$/, '$1').trim()) : [];
                });

                console.log("A_ JSON:", jsonData);

                await parseBankTransactions(jsonData, 0, 1, 2, 2, 4, "5", userId, false, transactions, 2, false, "3");

                console.log(`12_ Completei`);
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
