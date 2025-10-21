"use client";

import { useState } from "react";

interface RangeWidgetProps {
    onSubmit: (min: number, max: number) => void;
    onClose: () => void;
}

export default function RangeWidget({ onSubmit, onClose }: RangeWidgetProps) {
    const [min, setMin] = useState(0);
    const [max, setMax] = useState(100);

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-80">
                <h2 className="text-lg font-semibold mb-4">Enter Range</h2>
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm">Min Value</label>
                        <input
                            type="number"
                            value={min}
                            onChange={(e) => setMin(Number(e.target.value))}
                            className="border rounded px-2 py-1 w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm">Max Value</label>
                        <input
                            type="number"
                            value={max}
                            onChange={(e) => setMax(Number(e.target.value))}
                            className="border rounded px-2 py-1 w-full"
                        />
                    </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                    <button onClick={onClose} className="px-3 py-1 rounded bg-gray-300">Cancel</button>
                    <button
                        onClick={() => onSubmit(min, max)}
                        className="px-3 py-1 rounded bg-blue-600 text-white"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
