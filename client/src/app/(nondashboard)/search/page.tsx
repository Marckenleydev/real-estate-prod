// File: app/(nondashboard)/search/page.tsx
"use client";

import React, { Suspense } from "react";
import { NAVBAR_HEIGHT } from "@/lib/constants";
import SearchContent from "./SearchContent";

export default function SearchPage() {
  return (
    <div
      className="w-full mx-auto px-5 flex flex-col"
      style={{
        height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
      }}
    >
      <Suspense fallback={<div>Loading search results...</div>}>
        <SearchContent />
      </Suspense>
    </div>
  );
}