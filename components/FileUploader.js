"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileText, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

export default function FileUploader({ onFilesSelected, files, removing }) {
    const onDrop = useCallback((acceptedFiles) => {
        onFilesSelected(acceptedFiles);
    }, [onFilesSelected]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "application/pdf": [".pdf"],
            "image/*": [".png", ".jpg", ".jpeg"],
        },
    });

    return (
        <div className="w-full">
            <div
                {...getRootProps()}
                className={clsx(
                    "relative group cursor-pointer transition-all duration-300 rounded-2xl border-2 border-dashed p-10 flex flex-col items-center justify-center min-h-[240px]",
                    isDragActive ? "border-primary bg-primary/5 scale-[0.99]" : "border-glass-border hover:border-primary/50 hover:bg-glass-bg",
                    files.length > 0 && "py-6 min-h-[160px]"
                )}
            >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center text-center gap-4">
                    <div className={clsx(
                        "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
                        isDragActive ? "bg-primary text-white scale-110" : "bg-glass-bg text-primary group-hover:scale-110"
                    )}>
                        <Upload size={32} />
                    </div>

                    <div>
                        <p className="text-xl font-bold mb-1">
                            {isDragActive ? "Drop documents here" : "Upload your Research Documents"}
                        </p>
                        <p className="text-text-secondary text-sm">
                            Drag & drop annual reports or financial statement images (PDF, PNG, JPG)
                        </p>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-6 flex flex-col gap-3"
                    >
                        {files.map((file, index) => (
                            <motion.div
                                key={file.name + index}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="glass-panel p-4 rounded-xl flex items-center justify-between border border-glass-border"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm truncate max-w-[200px] md:max-w-md">{file.name}</p>
                                        <p className="text-xs text-text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removing(index);
                                    }}
                                    className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors text-text-muted"
                                >
                                    <X size={18} />
                                </button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
