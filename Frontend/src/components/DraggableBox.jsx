import React, { useState, useEffect, useRef } from "react";

const DraggableBox = ({
    id,
    x,
    y,
    width,
    height,
    type,
    value,
    onDragStop,
    onResizeStop,
    onDelete,
    onChange,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const boxRef = useRef(null);
    const fileInputRef = useRef(null);

    const offset = useRef({ x: 0, y: 0 });
    const startDim = useRef({ w: 0, h: 0, x: 0, y: 0 });

    const getCoords = (e) => {
        if (e.touches)
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        return { x: e.clientX, y: e.clientY };
    };

    //  DRAG START
    const handleStart = (e) => {
        if (e.touches) e.stopPropagation();

        setIsDragging(true);
        const { x, y } = getCoords(e);
        const rect = boxRef.current.getBoundingClientRect();
        offset.current = { x: x - rect.left, y: y - rect.top };
    };

    // RESIZE START
    const handleResizeStart = (e) => {
        e.stopPropagation();
        setIsResizing(true);
        const { x, y } = getCoords(e);
        const rect = boxRef.current.getBoundingClientRect();
        startDim.current = {
            w: rect.width,
            h: rect.height,
            startX: x,
            startY: y,
        };
    };

    useEffect(() => {
        const handleMove = (e) => {
            if (!isDragging && !isResizing) return;
            if (e.touches) e.preventDefault();

            const parent = boxRef.current?.offsetParent;
            if (!parent) return;
            const parentRect = parent.getBoundingClientRect();
            const { x, y } = getCoords(e);

            if (isDragging) {
                let newX = x - parentRect.left - offset.current.x;
                let newY = y - parentRect.top - offset.current.y;

                // Boundaries
                newX = Math.max(0, Math.min(newX, parentRect.width - width));
                newY = Math.max(0, Math.min(newY, parentRect.height - height));

                onDragStop(id, newX, newY);
            }

            if (isResizing) {
                const deltaX = x - startDim.current.startX;
                const deltaY = y - startDim.current.startY;
                onResizeStop(
                    id,
                    Math.max(30, startDim.current.w + deltaX),
                    Math.max(30, startDim.current.h + deltaY)
                );
            }
        };

        const handleEnd = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        if (isDragging || isResizing) {
            window.addEventListener("mousemove", handleMove);
            window.addEventListener("mouseup", handleEnd);
            window.addEventListener("touchmove", handleMove, {
                passive: false,
            });
            window.addEventListener("touchend", handleEnd);
        }
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleEnd);
            window.removeEventListener("touchmove", handleMove);
            window.removeEventListener("touchend", handleEnd);
        };
    }, [isDragging, isResizing, width, height, id, onDragStop, onResizeStop]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => onChange(id, reader.result);
            reader.readAsDataURL(file);
        }
    };

    // RENDER INPUTS
    const renderContent = () => {
        switch (type) {
            case "TEXT":
                return (
                    <textarea
                        className="w-full h-full p-1 text-[12px] bg-transparent resize-none outline-none text-gray-700"
                        placeholder="Type here..."
                        value={value || ""}
                        onChange={(e) => onChange(id, e.target.value)}
                    />
                );
            case "DATE":
                return (
                    <input
                        type="date"
                        className="w-full h-full text-[10px] bg-transparent outline-none"
                        value={value || ""}
                        onChange={(e) => onChange(id, e.target.value)}
                    />
                );
            case "RADIO":
                return (
                    <div className="flex items-center gap-1 h-full pl-1">
                        <input
                            type="radio"
                            checked={!!value}
                            onClick={() => onChange(id, !value)}
                            className="w-4 h-4 cursor-pointer"
                        />
                    </div>
                );
            case "IMAGE":
            case "SIGNATURE":
                return (
                    <div
                        className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-black/5"
                        onClick={() => fileInputRef.current.click()}
                    >
                        {value ? (
                            <img
                                src={value}
                                alt="Uploaded"
                                className="w-full h-full object-contain"
                                draggable={false}
                            />
                        ) : (
                            <div className="text-center pointer-events-none">
                                <div className="text-lg">
                                    {type === "SIGNATURE" ? "✍️" : "🖼️"}
                                </div>
                                <div className="text-[8px] text-gray-500 font-medium">
                                    {type === "SIGNATURE" ? "Sign" : "Image"}
                                </div>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileSelect}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div
            ref={boxRef}
            className={`absolute z-50 flex flex-col shadow-sm bg-white/90
        ${
            isDragging
                ? "border-2 border-blue-600 shadow-xl"
                : "border border-blue-400 border-dashed hover:border-solid"
        }
      `}
            style={{ left: x, top: y, width: width, height: height }}
        >
            {/* DRAG HANDLE  */}
            <div
                onMouseDown={handleStart}
                onTouchStart={handleStart}
                className="w-full h-4 bg-blue-100 border-b border-blue-200 cursor-move flex items-center justify-center"
            >
                <div className="flex gap-0.5">
                    <div className="w-4 h-0.5 bg-blue-300 rounded-full"></div>
                </div>

                {/* Delete Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(id);
                    }}
                    onTouchEnd={(e) => {
                        e.stopPropagation();
                        onDelete(id);
                    }}
                    className="absolute right-0 top-0 w-4 h-4 bg-red-500 text-white flex items-center justify-center text-[10px] hover:bg-red-600"
                >
                    ×
                </button>
            </div>

            {/* CONTENT AREA*/}
            <div
                className="flex-1 w-full h-full relative overflow-hidden"
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
            >
                {renderContent()}
            </div>

            {/* Resize Handle */}
            <div
                onMouseDown={handleResizeStart}
                onTouchStart={handleResizeStart}
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 z-50"
            >
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-sm" />
            </div>
        </div>
    );
};

export default DraggableBox;
