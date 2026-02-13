"use client";

import { useState, useCallback, useRef } from "react";

const API_ENDPOINT = "/api/extract/financial";

export default function ResearchPortal() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileBase64, setFileBase64] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const fileInputRef = useRef(null);

  const readFileAsBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a PDF or image file (PNG, JPG).");
      return;
    }
    setError(null);
    setResult(null);
    setUploadedFile(file);
    try {
      const b64 = await readFileAsBase64(file);
      setFileBase64(b64);
    } catch {
      setError("Failed to read file.");
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const runExtraction = async () => {
    if (!uploadedFile) {
      setError("Please upload a document first.");
      return;
    }
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      setProcessingStep("Analyzing document with AI...");

      const formData = new FormData();
      formData.append("files", uploadedFile);

      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      setProcessingStep("Parsing results...");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  const downloadCSV = () => {
    if (!result?.sections) return;
    const periods = result.periods || [];
    const rows = [["Section", "Line Item", ...periods, "Note"]];
    result.sections.forEach((section) => {
      section.items.forEach((item) => {
        rows.push([
          section.name,
          item.label,
          ...periods.map((p) => {
            const v = item.values?.[p];
            return v !== undefined && v !== null ? v : "N/A";
          }),
          item.note || "",
        ]);
      });
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" })),
      download: `${result.company || "financial"}_extracted_${Date.now()}.csv`,
    });
    a.click();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0c14", color: "#e2e8f0", fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      <div style={{ borderBottom: "1px solid #1e2433", padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0d1120" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⬡</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "#f1f5f9" }}>Financial Statement Extractor</div>
            <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase" }}>Upload · Extract · Download CSV</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#475569", background: "#111827", padding: "6px 14px", borderRadius: 20, border: "1px solid #1e2433" }}>
          Internal Access Only
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: "#64748b", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Upload Document</div>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: dragOver ? "1.5px dashed #3b82f6" : uploadedFile ? "1.5px solid #22c55e" : "1.5px dashed #2d3748",
              borderRadius: 12, padding: "36px 24px", textAlign: "center", cursor: "pointer",
              background: dragOver ? "rgba(59,130,246,0.05)" : uploadedFile ? "rgba(34,197,94,0.04)" : "rgba(255,255,255,0.01)",
              transition: "all 0.2s",
            }}
          >
            <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
            {uploadedFile ? (
              <>
                <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                <div style={{ fontSize: 14, color: "#86efac", fontWeight: 600 }}>{uploadedFile.name}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{(uploadedFile.size / 1024).toFixed(0)} KB · Click to replace</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.5 }}>📄</div>
                <div style={{ fontSize: 15, color: "#94a3b8", fontWeight: 500 }}>Drop your document here or click to browse</div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>PDF, PNG, JPG · Annual reports, quarterly statements, P&L sheets</div>
              </>
            )}
          </div>
        </div>

        <button
          onClick={runExtraction}
          disabled={isProcessing || !uploadedFile}
          style={{
            width: "100%", padding: 16, borderRadius: 10, border: "none",
            background: isProcessing || !uploadedFile ? "#1e2433" : "linear-gradient(135deg, #2563eb, #7c3aed)",
            color: isProcessing || !uploadedFile ? "#475569" : "#fff",
            fontSize: 15, fontWeight: 700, cursor: isProcessing || !uploadedFile ? "not-allowed" : "pointer",
            letterSpacing: "0.02em", transition: "all 0.2s", marginBottom: 8,
          }}
        >
          {isProcessing ? processingStep || "Processing..." : "Extract Financial Data →"}
        </button>

        {isProcessing && (
          <div style={{ textAlign: "center", marginTop: 10 }}>
            <div style={{ display: "inline-flex", gap: 4 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 16, padding: "14px 18px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, color: "#fca5a5", fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}

        {result && (
          <div style={{ marginTop: 36 }}>
            <div style={{ background: "#0d1120", border: "1px solid #1e2433", borderRadius: 12, padding: "24px 28px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>{result.company}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 10 }}>
                  {result.document_type}&nbsp;·&nbsp;
                  <span style={{ color: "#93c5fd" }}>{result.currency} {result.unit}</span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(result.periods || []).map((p) => (
                    <span key={p} style={{ padding: "3px 12px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 20, fontSize: 12, color: "#93c5fd" }}>{p}</span>
                  ))}
                </div>
                {result.extraction_notes && (
                  <div style={{ marginTop: 12, fontSize: 12, color: "#94a3b8", background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.12)", padding: "8px 12px", borderRadius: 6, maxWidth: 600, lineHeight: 1.6 }}>
                    ℹ️ {result.extraction_notes}
                  </div>
                )}
              </div>
              <button
                onClick={downloadCSV}
                style={{ padding: "12px 22px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, color: "#86efac", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
              >
                ⬇ Download CSV
              </button>
            </div>

            {(result.sections || []).map((section) => (
              <div key={section.name} style={{ marginBottom: 18, background: "#0d1120", border: "1px solid #1e2433", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "11px 20px", background: "#111827", borderBottom: "1px solid #1e2433", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8" }}>
                  {section.name}
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                        <th style={{ textAlign: "left", padding: "10px 20px", color: "#64748b", fontWeight: 600, minWidth: 240, borderBottom: "1px solid #1e2433" }}>Line Item</th>
                        {(result.periods || []).map((p) => (
                          <th key={p} style={{ textAlign: "right", padding: "10px 16px", color: "#64748b", fontWeight: 600, minWidth: 110, borderBottom: "1px solid #1e2433" }}>{p}</th>
                        ))}
                        <th style={{ textAlign: "left", padding: "10px 16px", color: "#64748b", fontWeight: 600, minWidth: 140, borderBottom: "1px solid #1e2433" }}>Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(section.items || []).map((item, idx) => {
                        const isTotal = /^(total|net|gross)/i.test(item.label);
                        return (
                          <tr key={idx} style={{ borderBottom: "1px solid #111827", background: isTotal ? "rgba(255,255,255,0.015)" : "transparent" }}>
                            <td style={{ padding: "11px 20px", color: isTotal ? "#f1f5f9" : "#cbd5e1", fontWeight: isTotal ? 600 : 400 }}>
                              {item.label}
                            </td>
                            {(result.periods || []).map((p) => {
                              const val = item.values?.[p];
                              const isNA = val === undefined || val === null || val === "N/A" || val === "-" || val === "–";
                              const isNeg = typeof val === "number" && val < 0;
                              return (
                                <td key={p} style={{ padding: "11px 16px", textAlign: "right", color: isNA ? "#374151" : isNeg ? "#f87171" : "#e2e8f0", fontVariantNumeric: "tabular-nums", fontWeight: isTotal ? 600 : 400 }}>
                                  {isNA ? "—" : typeof val === "number" ? val.toLocaleString("en-IN") : val}
                                </td>
                              );
                            })}
                            <td style={{ padding: "11px 16px", color: "#64748b", fontSize: 11, fontStyle: "italic" }}>{item.note || ""}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
