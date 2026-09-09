"use client";

import { useState } from "react";
import Button from "../Components/Button/Button";
import EmployeeManager from "./EmployeeManagerForm";

export default function EmployeeModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Button */}
      <div className="flex justify-center">
        <Button variant="primary" size="md" onClick={() => setIsOpen(true)}>
          + Add Employee Details
        </Button>
      </div>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-amber-100 shadow-xl max-w-3xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            
            {/* Close Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-amber-100">
              <h3 className="text-lg font-bold text-stone-900">
                Employee Management
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-stone-400 hover:text-stone-600 font-bold p-1 rounded-lg text-sm cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Employee Form & List */}
            <EmployeeManager />
          </div>
        </div>
      )}
    </>
  );
}