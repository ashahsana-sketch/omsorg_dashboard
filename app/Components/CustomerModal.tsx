"use client";

import { useState } from "react";
import CustomerManagerForm from "./CustomerManagerForm";

export default function CustomerModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Button */}
      <div className="flex justify-center">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors shadow-sm cursor-pointer"
        >
          + Add New Client
        </button>
      </div>

      {/* Modal Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-amber-100 shadow-xl max-w-md w-full p-6 relative">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-teal-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-stone-800">
                Add New Care Client
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-stone-400 hover:text-stone-600 font-bold text-xs p-1 rounded-md transition-colors cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Form */}
            <CustomerManagerForm onSuccess={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}