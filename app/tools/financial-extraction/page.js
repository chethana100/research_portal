"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    BarChart3,
    Download,
    Play,
    RotateCcw,
    Table as TableIcon,
    AlertCircle,
    CheckCircle2,
    FileSpreadsheet
} from "lucide-react";
import Link from "next/link";
import FileUploader from "@/components/FileUploader";

export default function FinancialExtractionPage() {
    const [files, setFiles] = useState([]);
    const [isExtracting, setIsExtracting] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleFilesSelected = (newFiles) => {
        setFiles((prev) => [...prev, ...newFiles]);
        setError(null);
    };

    const removeFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const startExtraction = async () => {
        if (files.length === 0) return;

        setIsExtracting(true);
        setError(null);
        setResult(null);

        try {
            const formData = new FormData();
            files.forEach((file) => formData.append("files", file));

            const response = await fetch("/api/extract/financial", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Extraction failed. Please check your documents and try again.");
            }

            const data = await response.json();
            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsExtracting(false);
        }
    };

    const downloadExcel = async () => {
        if (!result) return;

        try {
            const response = await fetch("/api/export/excel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: result }),
            });

            if (!response.ok) throw new Error("Export failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Financial_Extraction_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError("Failed to download Excel file.");
        }
    };

    return (
        <div className="flex-1 flex flex-col p-6 md:p-12 max-w-6xl mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <Link href="/">
                    <button className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Explorer</span>
                    </button>
                </Link>
                <div className="flex items-center gap-3 glass-panel px-4 py-2 rounded-xl border-glass-border">
                    <BarChart3 size={20} className="text-primary" />
                    <span className="font-bold text-sm">Financial Statement Extractor</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left Side: Upload & Action */}
                <div className="lg:col-span-5 space-y-8">
                    <section>
                        <h1 className="text-4xl font-bold mb-4 tracking-tight">Extract Intelligence.</h1>
                        <p className="text-text-secondary leading-relaxed mb-8">
                            Upload your financial statements to automatically extract structured line items,
                            handle reclassifications, and prepare analysis-ready Excel files.
                        </p>

                        <FileUploader
                            onFilesSelected={handleFilesSelected}
                            files={files}
                            removing={removeFile}
                        />
                    </section>

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={startExtraction}
                            disabled={files.length === 0 || isExtracting}
                            className="w-full gradient-bg text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary/20 transition-all"
                        >
                            {isExtracting ? (
                                <>
                                    <Loader2 size={24} className="animate-spin" />
                                    <span>Processing Analysis...</span>
                                </>
                            ) : (
                                <>
                                    <Play size={20} className="fill-current" />
                                    <span>Execute Extraction</span>
                                </>
                            )
                            }
                        </button>

                        {result && (
                            <button
                                onClick={() => {
                                    setFiles([]);
                                    setResult(null);
                                    setError(null);
                                }}
                                className="w-full glass-panel py-4 rounded-xl flex items-center justify-center gap-3 text-text-secondary hover:text-white transition-all"
                            >
                                <RotateCcw size={20} />
                                <span>Reset Tool</span>
                            </button>
                        )}
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-start gap-3"
                        >
                            <AlertCircle size={20} className="shrink-0 mt-0.5" />
                            <p className="text-sm">{error}</p>
                        </motion.div>
                    )}
                </div>

                {/* Right Side: Preview / Results */}
                <div className="lg:col-span-7">
                    <div className="glass-card h-full min-h-[500px] flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-glass-border flex items-center justify-between bg-white/5">
                            <div className="flex items-center gap-3">
                                <TableIcon size={20} className="text-primary" />
                                <h2 className="font-bold uppercase tracking-wider text-xs">Output Preview</h2>
                            </div>

                            {result && (
                                <button
                                    onClick={downloadExcel}
                                    className="px-4 py-2 bg-success/20 hover:bg-success/30 text-success border border-success/30 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
                                >
                                    <Download size={16} />
                                    <span>Download Excel</span>
                                </button>
                            )}
                        </div>

                        <div className="flex-1 p-0 overflow-auto relative">
                            <AnimatePresence mode="wait">
                                {!result && !isExtracting && (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 flex flex-col items-center justify-center text-center p-12"
                                    >
                                        <div className="w-20 h-20 rounded-full bg-glass-bg flex items-center justify-center text-text-muted mb-6">
                                            <FileSpreadsheet size={40} />
                                        </div>
                                        <h3 className="text-lg font-bold mb-2">No Data Extracted</h3>
                                        <p className="text-text-muted max-w-xs text-sm">
                                            Upload and process a document to see the structured financial data here.
                                        </p>
                                    </motion.div>
                                )}

                                {isExtracting && (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 flex flex-col items-center justify-center bg-bg-color/50 backdrop-blur-sm z-10"
                                    >
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="relative">
                                                <div className="w-16 h-16 rounded-full border-4 border-primary/20" />
                                                <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin absolute top-0" />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-bold text-lg mb-1">Analyzing Document Structure</p>
                                                <p className="text-text-muted text-sm px-12">
                                                    Our AI is identifying line items, numbers, and currency units...
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {result && (
                                    <motion.div
                                        key="result"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="overflow-x-auto pb-12"
                                    >
                                        <div className="p-6 bg-white/5 border-b border-glass-border">
                                            <h3 className="text-xl font-bold flex items-center gap-2">
                                                <CheckCircle2 size={20} className="text-success" />
                                                {result.company}
                                            </h3>
                                            <p className="text-text-secondary text-sm mt-1">
                                                {result.document_type} · {result.extraction_notes}
                                            </p>
                                        </div>

                                        <table className="w-full text-left text-sm border-collapse">
                                            <thead>
                                                <tr className="bg-white/5 border-b border-glass-border">
                                                    <th className="p-4 font-bold text-text-secondary uppercase tracking-widest text-[10px]">Particulars</th>
                                                    {result.periods.map(period => (
                                                        <th key={period} className="p-4 font-bold text-text-secondary uppercase tracking-widest text-[10px] text-right">{period}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {result.sections.map((section, sIdx) => (
                                                    <React.Fragment key={sIdx}>
                                                        <tr className="bg-primary/5">
                                                            <td colSpan={result.periods.length + 1} className="p-3 font-bold text-primary uppercase tracking-wider text-[10px]">
                                                                {section.name}
                                                            </td>
                                                        </tr>
                                                        {section.items.map((item, iIdx) => (
                                                            <tr key={`${sIdx}-${iIdx}`} className="border-b border-glass-border/50 hover:bg-white/5 transition-colors">
                                                                <td className="p-4 font-medium text-text-primary pl-8">{item.label}</td>
                                                                {result.periods.map(period => (
                                                                    <td key={period} className="p-4 text-right font-mono text-text-secondary">
                                                                        {item.values[period] !== null && item.values[period] !== undefined ? (
                                                                            typeof item.values[period] === 'number' ?
                                                                                item.values[period].toLocaleString() :
                                                                                item.values[period]
                                                                        ) : (
                                                                            <span className="text-text-muted italic">N/A</span>
                                                                        )}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </React.Fragment>
                                                ))}
                                            </tbody>
                                        </table>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {result && (
                            <div className="p-4 bg-white/5 text-[10px] text-text-muted border-t border-glass-border flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-success" />
                                    <span>Currency: {result.currency}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-primary" />
                                    <span>Units: {result.unit}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-warning" />
                                    <span>OCR Confidence: {result.confidence}%</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
