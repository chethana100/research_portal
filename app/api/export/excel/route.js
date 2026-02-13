import ExcelJS from "exceljs";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { data } = await req.json();

        if (!data || !data.items) {
            return NextResponse.json({ error: "No data provided" }, { status: 400 });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Financial Extraction");

        // Headings
        const headerRow = ["Particulars", ...data.periods];
        const header = worksheet.addRow(headerRow);

        // Style Header
        header.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF6366F1" },
            };
            cell.alignment = { horizontal: "center", vertical: "middle" };
        });

        // Add Data Grouped by Sections
        data.sections.forEach((section) => {
            // Add Section Header Row
            const sectionRow = worksheet.addRow([section.name.toUpperCase()]);
            sectionRow.getCell(1).font = { bold: true, color: { argb: "FF6366F1" } };
            sectionRow.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF1F5F9" },
            };
            worksheet.mergeCells(sectionRow.number, 1, sectionRow.number, data.periods.length + 1);

            section.items.forEach((item, index) => {
                const rowData = [item.label];
                data.periods.forEach((period) => {
                    rowData.push(item.values[period] ?? "");
                });

                const row = worksheet.addRow(rowData);

                // Alternate row styling
                if (index % 2 !== 0) {
                    row.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFF9FAFB" },
                    };
                }

                // Column formatting
                row.eachCell((cell, colNumber) => {
                    if (colNumber > 1) {
                        cell.alignment = { horizontal: "right" };
                        if (typeof cell.value === 'number') {
                            cell.numFmt = "#,##0";
                        }
                    } else {
                        cell.font = { bold: /total|profit|net/i.test(item.label) };
                    }
                });
            });

            worksheet.addRow([]); // Gap between sections
        });

        // Add metadata info at the bottom
        const footer1 = worksheet.addRow(["Currency", data.currency]);
        footer1.getCell(1).font = { italic: true };
        const footer2 = worksheet.addRow(["Units", data.unit]);
        footer2.getCell(1).font = { italic: true };
        const footer3 = worksheet.addRow(["Extraction Confidence", `${data.confidence}%`]);
        footer3.getCell(1).font = { italic: true };
        const footer4 = worksheet.addRow(["Notes", data.extraction_notes]);
        footer4.getCell(1).font = { italic: true };

        // Auto-fit columns
        worksheet.columns.forEach((column) => {
            let maxWidth = 12;
            column.eachCell({ includeEmpty: true }, (cell) => {
                const columnWidth = cell.value ? cell.value.toString().length : 12;
                if (columnWidth > maxWidth) {
                    maxWidth = columnWidth;
                }
            });
            column.width = maxWidth + 5;
        });

        // Generate Buffer
        const buffer = await workbook.xlsx.writeBuffer();

        return new Response(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": 'attachment; filename="financial_extraction.xlsx"',
            },
        });
    } catch (error) {
        console.error("Excel generation error:", error);
        return NextResponse.json({ error: "Failed to generate Excel" }, { status: 500 });
    }
}
