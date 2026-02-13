import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const maxDuration = 60; // Set timeout to 60 seconds for Gemini extraction

const genAI = new GoogleGenerativeAI(process.env.chethana || "");

export async function POST(req) {
    try {
        const formData = await req.formData();
        const files = formData.getAll("files");

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
        }

        if (!process.env.chethana) {
            console.warn("API Key 'chethana' not found in environment variables. Returning demo data.");
            return NextResponse.json(getMockData());
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const parts = await Promise.all(
            files.map(async (file) => {
                const buffer = Buffer.from(await file.arrayBuffer());
                return {
                    inlineData: {
                        data: buffer.toString("base64"),
                        mimeType: file.type,
                    },
                };
            })
        );

        const prompt = `
      You are a senior financial extraction specialist. Extract structured financial data from the provided documents (annual reports, quarterly results, or financial images).
      
      CRITICAL RULES:
      1. Identify the Company Name, Document Type, Currency, and Units.
      2. Identify all Years/Periods present (e.g., "FY 2025", "FY 2024"). Focus on "Year Ended" or "Annual" data if available.
      3. Extract line items grouped by SECTIONS (e.g., "Revenue", "Expenses", "Profit & Tax").
      4. For each section, extract both the main headings and the sub-items if they have values.
      5. Standardize line item names but remain faithful to the source (e.g., "(a) Revenue" -> "Revenue").
      6. All numeric values must be extracted as NUMBERS. Use null if a value is missing for a specific period.
      7. Handle multi-year data by creating a map of period labels to values.
      8. Detect if values are in millions, billions, or crores and note the unit.
      
      OUTPUT FORMAT:
      Return ONLY a valid JSON object in this exact schema:
      {
        "company": "Company Name",
        "document_type": "Annual Report",
        "currency": "INR",
        "unit": "Crores",
        "periods": ["FY 2025", "FY 2024"],
        "sections": [
          {
            "name": "Revenue",
            "items": [
              { "label": "Revenue from operations", "values": { "FY 2025": 119508, "FY 2024": 112608 } },
              { "label": "Other Income", "values": { "FY 2025": 1509, "FY 2024": 1726 } }
            ]
          },
          {
            "name": "Expenses",
            "items": [
              { "label": "Cost of materials consumed", "values": { "FY 2025": 63925, "FY 2024": 60798 } },
              { "label": "Employee benefits expense", "values": { "FY 2025": 12663, "FY 2024": 11876 } }
            ]
          }
        ],
        "extraction_notes": "Extracted from consolidated audited results.",
        "confidence": 98
      }
    `;

        const result = await model.generateContent([prompt, ...parts]);
        const response = await result.response;
        const text = response.text();

        // Improved JSON cleaning
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Could not find valid JSON in response");
        }
        const data = JSON.parse(jsonMatch[0]);

        return NextResponse.json(data);
    } catch (error) {
        console.error("Extraction error detailed:", {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        return NextResponse.json({ error: "Failed to extract data: " + error.message }, { status: 500 });
    }
}

function getMockData() {
    return {
        "company": "TATA MOTORS LIMITED",
        "document_type": "Statement of Consolidated Audited Financial Results",
        "currency": "INR",
        "unit": "Crores",
        "periods": ["FY 2025", "FY 2024"],
        "sections": [
            {
                "name": "Income",
                "items": [
                    { "label": "Revenue from operations", "values": { "FY 2025": 119508, "FY 2024": 112608 } },
                    { "label": "Other Income", "values": { "FY 2025": 1509, "FY 2024": 1726 } },
                    { "label": "Total Income", "values": { "FY 2025": 121017, "FY 2024": 114334 } }
                ]
            },
            {
                "name": "Expenses",
                "items": [
                    { "label": "Cost of materials consumed", "values": { "FY 2025": 63925, "FY 2024": 60798 } },
                    { "label": "Purchase of products for sale", "values": { "FY 2025": 6548, "FY 2024": 6354 } },
                    { "label": "Employee benefits expense", "values": { "FY 2025": 12663, "FY 2024": 11876 } },
                    { "label": "Finance costs", "values": { "FY 2025": 1076, "FY 2024": 1119 } },
                    { "label": "Other expenses", "values": { "FY 2025": 21187, "FY 2024": 24184 } },
                    { "label": "Total expenses", "values": { "FY 2025": 109056, "FY 2024": 106665 } }
                ]
            },
            {
                "name": "Profit",
                "items": [
                    { "label": "Profit before tax", "values": { "FY 2025": 11504, "FY 2024": 7605 } },
                    { "label": "Profit for the year", "values": { "FY 2025": 8556, "FY 2024": 5485 } }
                ]
            }
        ],
        "extraction_notes": "DEMO MODE: API Key 'chethana' not found. This is TATA MOTORS sample data. Set your key on Vercel to extract from your own documents.",
        "confidence": 95
    };
}
