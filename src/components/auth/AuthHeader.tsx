
import React from "react";

interface AuthHeaderProps {
  title: string;
  description: string;
}

export function AuthHeader({ title, description }: AuthHeaderProps) {
  return (
    <div className="text-center mb-6">
      <h1 className="text-3xl font-bold text-zoom-blue mb-2">ZoomFree</h1>
      <p className="text-gray-600">Free video conferencing for everyone</p>
    </div>
  );
}
