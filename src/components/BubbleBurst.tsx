import React from "react";

export default function BubbleBurst({ show }: { show: boolean }) {
  return show ? (
    <span className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
      <span className="bubble-burst" />
    </span>
  ) : null;
}