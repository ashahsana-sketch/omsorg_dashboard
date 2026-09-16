// @/components/ClientReviews.tsx
"use client";

import React from "react";
import reviewData from "@/data/ClientReviews.json"

export interface Review {
  id: string;
  clientName: string;
  careLevel: string;
  rating: number; // e.g., 1 to 5
  comment: string;
  date: string;
}

interface ClientReviewsProps {
  reviews: Review[];
}

export default function ClientReviews({ reviews }: ClientReviewsProps) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-stone-200 text-center text-stone-500 text-xs shadow-sm">
        No reviews available at the moment.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-md font-bold text-2xl text-teal-800">Client Feedback & Reviews</h3>
        <span className="text-xs text-stone-500 font-semibold">{reviews.length} Review(s)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-white border border-stone-200 p-4 rounded-xl shadow-xs hover:shadow-md transition space-y-2"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-stone-900 text-sm">{review.clientName}</h4>
                <span className="inline-block bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 border border-teal-200">
                  {review.careLevel}
                </span>
              </div>
              <span className="text-xs text-stone-400 font-medium">{review.date}</span>
            </div>

            {/* Star Rating Display */}
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`text-sm ${
                    i < review.rating ? "text-amber-400" : "text-stone-300"
                  }`}
                >
                  ★
                </span>
              ))}
              <span className="text-xs text-stone-600 ml-1 font-bold">({review.rating}.0)</span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed italic">
              &ldquo;{review.comment}&rdquo;
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}