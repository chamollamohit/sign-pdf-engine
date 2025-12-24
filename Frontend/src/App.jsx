import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import DraggableBox from "./components/DraggableBox";
import axios from "axios";
import "react-pdf/dist/cjs/Page/AnnotationLayer.css";
import "react-pdf/dist/cjs/Page/TextLayer.css";

// Worker Config
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).toString();

export default function App() {
    const [file, setFile] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [fields, setFields] = useState([]);
    const [pdfWidth, setPdfWidth] = useState(600);
    const [selectedTool, setSelectedTool] = useState("SIGNATURE");
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const pdfContainerRef = useRef(null);

    // Dynamic Width Calculation
    useEffect(() => {
        const updateWidth = () => {
            if (pdfContainerRef.current) {
                const newWidth = pdfContainerRef.current.offsetWidth - 32;
                setPdfWidth(Math.min(newWidth, 600));
            }
        };
        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, []);

    const handleFileChange = (e) => setFile(e.target.files[0]);

    const handleFieldChange = (id, value) => {
        setFields(
            fields.map((f) => (f.id === id ? { ...f, value: value } : f))
        );
    };

    // ADD FIELD
    const addFieldToPage = (pageNumber) => {
        let w = 20,
            h = 8;
        if (selectedTool === "IMAGE" || selectedTool === "SIGNATURE") {
            w = 25;
            h = 10;
        }
        if (selectedTool === "RADIO") {
            w = 10;
            h = 6;
        }

        setFields([
            ...fields,
            {
                id: Date.now(),
                type: selectedTool,
                page: pageNumber,
                x: 50 - w / 2,
                y: 50 - h / 2,
                width: w,
                height: h,
            },
        ]);
    };

    const handleDragStop = (id, newX, newY) => {
        const PAGE_HEIGHT = pdfWidth * 1.414;
        setFields(
            fields.map((f) =>
                f.id === id
                    ? {
                          ...f,
                          x: (newX / pdfWidth) * 100,
                          y: (newY / PAGE_HEIGHT) * 100,
                      }
                    : f
            )
        );
    };

    const handleResizeStop = (id, newW, newH) => {
        const PAGE_HEIGHT = pdfWidth * 1.414;
        setFields(
            fields.map((f) =>
                f.id === id
                    ? {
                          ...f,
                          width: (newW / pdfWidth) * 100,
                          height: (newH / PAGE_HEIGHT) * 100,
                      }
                    : f
            )
        );
    };

    // Sign PDF
    const handleSave = async () => {
        if (!file) {
            alert("Please upload a PDF first! 📄");
            return;
        }

        // Create FormData
        const formData = new FormData();
        // We send the array of fields as a JSON string
        formData.append("pdfId", "doc_" + Date.now());
        formData.append("fields", JSON.stringify(fields));
        formData.append("pdf", file);

        try {
            // Send to Backend
            const response = await axios.post(`${API_URL}/sign-pdf`, formData, {
                responseType: "blob",
            });

            // Create Download Link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "signed_document.pdf");
            document.body.appendChild(link);
            link.click();

            // Cleanup
            link.remove();
            window.URL.revokeObjectURL(url);

            alert("PDF Signed & Downloaded Successfully! 🚀");
        } catch (error) {
            console.error("Error signing PDF:", error);

            if (error.response) {
                alert(
                    `Server Error: ${error.response.status} - ${error.response.statusText}`
                );
            } else if (error.request) {
                alert("Network Error: Could not connect to backend server.");
            } else {
                alert(`Error: ${error.message}`);
            }
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-screen font-sans bg-gray-100 text-gray-900 overflow-hidden">
            {/* ---  MOBILE HEADER --- */}
            <div className="md:hidden bg-white p-3  flex justify-between items-center shadow-sm z-20">
                <span className="font-bold text-gray-600">Sign PDF</span>
                <button
                    className="text-xs bg-blue-50 text-gray-600 px-3 py-1 rounded font-medium hover:bg-amber-700"
                    onClick={handleSave}
                >
                    Download PDF
                </button>
                <label className="text-xs bg-blue-50 text-gray-600 px-3 py-1 rounded cursor-pointer font-medium">
                    {file ? "Change PDF" : "Upload PDF"}
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </label>
            </div>

            {/* ---  DESKTOP SIDEBAR  --- */}
            <div className="hidden md:flex w-72 bg-white border-r p-6 flex-col shadow-sm z-10">
                <h2 className="text-xl font-bold mb-6 text-gray-800">
                    Sign Form
                </h2>

                <div className="mb-6">
                    <p className="text-sm font-semibold text-gray-500 mb-2">
                        Selected Tool
                    </p>
                    <div className="grid gap-2">
                        <div className="grid grid-cols-2 gap-3">
                            <ToolButton
                                onClick={() => setSelectedTool("SIGNATURE")}
                                isSelected={selectedTool === "SIGNATURE"}
                                icon="✍️"
                                label="Signature"
                            />
                            <ToolButton
                                onClick={() => setSelectedTool("TEXT")}
                                isSelected={selectedTool === "TEXT"}
                                icon="📝"
                                label="Text"
                            />
                            <ToolButton
                                onClick={() => setSelectedTool("DATE")}
                                isSelected={selectedTool === "DATE"}
                                icon="📅"
                                label="Date"
                            />
                            <ToolButton
                                onClick={() => setSelectedTool("IMAGE")}
                                isSelected={selectedTool === "IMAGE"}
                                icon="🖼️"
                                label="Image"
                            />
                            <ToolButton
                                onClick={() => setSelectedTool("RADIO")}
                                isSelected={selectedTool === "RADIO"}
                                icon="⭕"
                                label="Radio"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-auto">
                    <label className="block w-full text-center py-2 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:bg-gray-50 mb-4">
                        <span className="text-sm text-gray-500">
                            {!file ? "Upload New PDF" : "Change File"}
                        </span>
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </label>
                    <button
                        className="w-full py-2 bg-amber-600 text-white font-bold rounded hover:bg-amber-700"
                        onClick={handleSave}
                    >
                        Save & Download PDF
                    </button>
                </div>
            </div>

            {/* --- MAIN PREVIEW AREA --- */}
            <div className="flex-1 overflow-y-auto relative bg-gray-200 pb-24 md:pb-0">
                {/* PDF Wrapper */}
                <div className="flex flex-col items-center justify-center py-8 min-h-full">
                    {!file && (
                        <div className="text-gray-400 mt-20">
                            Please Upload a PDF
                        </div>
                    )}

                    <div
                        ref={pdfContainerRef}
                        className="w-full max-w-[600px] px-4"
                    >
                        {file && (
                            <Document
                                file={file}
                                onLoadSuccess={({ numPages }) =>
                                    setNumPages(numPages)
                                }
                            >
                                {Array.from({ length: numPages }, (_, i) => {
                                    const pageNum = i + 1;
                                    const PAGE_HEIGHT = pdfWidth * 1.414;

                                    return (
                                        <div
                                            key={pageNum}
                                            className="relative mb-6 shadow-md ring-1 ring-black/5 bg-white"
                                        >
                                            {/* PAGE HEADER: "Add Field" Button */}
                                            <div className="absolute -top-6 left-0 w-full flex justify-between items-center px-1">
                                                <span className="text-xs text-gray-500 font-medium">
                                                    Page {pageNum}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        addFieldToPage(pageNum)
                                                    }
                                                    className="bg-cyan-600 text-white text-xs px-3 py-1 rounded shadow hover:bg-cyan-700 flex items-center gap-1"
                                                >
                                                    <span>+</span> Add{" "}
                                                    {selectedTool}
                                                </button>
                                            </div>

                                            {/* PDF Render */}
                                            <Page
                                                pageNumber={pageNum}
                                                width={pdfWidth}
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                                className="bg-white"
                                                loading="PDF is loading please wait..."
                                            />

                                            {/* Fields */}
                                            {fields
                                                .filter(
                                                    (f) => f.page === pageNum
                                                )
                                                .map((field) => (
                                                    <DraggableBox
                                                        key={field.id}
                                                        {...field}
                                                        x={
                                                            (field.x / 100) *
                                                            pdfWidth
                                                        }
                                                        y={
                                                            (field.y / 100) *
                                                            PAGE_HEIGHT
                                                        }
                                                        width={
                                                            (field.width /
                                                                100) *
                                                            pdfWidth
                                                        }
                                                        height={
                                                            (field.height /
                                                                100) *
                                                            PAGE_HEIGHT
                                                        }
                                                        onDragStop={
                                                            handleDragStop
                                                        }
                                                        onResizeStop={
                                                            handleResizeStop
                                                        }
                                                        onDelete={(id) =>
                                                            setFields(
                                                                fields.filter(
                                                                    (f) =>
                                                                        f.id !==
                                                                        id
                                                                )
                                                            )
                                                        }
                                                        onChange={
                                                            handleFieldChange
                                                        }
                                                    />
                                                ))}
                                        </div>
                                    );
                                })}
                            </Document>
                        )}
                    </div>
                </div>
            </div>

            {/* --- MOBILE BOTTOM TOOLBAR  --- */}
            <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t p-2 flex justify-around items-center shadow-[0_-2px_5px_rgba(0,0,0,0.05)] z-50">
                {["SIGNATURE", "TEXT", "DATE", "RADIO"].map((tool) => (
                    <button
                        key={tool}
                        onClick={() => setSelectedTool(tool)}
                        className={`flex flex-col items-center p-2 rounded ${
                            selectedTool === tool
                                ? "text-black-600 bg-blue-200"
                                : "text-gray-500"
                        }`}
                    >
                        <span className="text-lg">
                            {tool === "SIGNATURE" && "✍️"}
                            {tool === "TEXT" && "📝"}
                            {tool === "DATE" && "📅"}
                            {tool === "RADIO" && "⭕"}
                        </span>
                        <span className="text-[10px] font-medium mt-1">
                            {tool}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function ToolButton({ onClick, icon, label, isSelected }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all shadow-sm hover:scale-95 ${
                isSelected
                    ? "bg-blue-50 ring-1 "
                    : "bg-white border-gray-200 hover:ring-1 hover:bg-blue-50"
            }`}
        >
            <span className="text-xl mb-1">{icon}</span>
            <span className="text-xs font-medium text-gray-700">{label}</span>
        </button>
    );
}
