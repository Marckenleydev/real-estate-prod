// File: app/(nondashboard)/search/SearchContent.tsx
"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/state/redux";
import { cleanParams } from "@/lib/utils";
import { setFilters } from "@/state";
import FiltersBar from "./FiltersBar";
import FiltersFull from "./FiltersFull";
import Map from "./Map";
import Listings from "./Listings";

const SearchContent = () => {
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const isFiltersFullOpen = useAppSelector(
    (state) => state.global.isFiltersFullOpen
  );

  useEffect(() => {
    const initialFilters = Array.from(searchParams.entries()).reduce(
      (acc: any, [key, value]) => {
        if (key === "priceRange" || key === "squareFeet") {
          acc[key] = value.split(",").map((v) => (v === "" ? null : Number(v)));
        } else if (key === "coordinates") {
          acc[key] = value.split(",").map(Number);
        } else if (key === "lat" && searchParams.get("lng")) {
          // Handle lat/lng params from the URL
          const lat = Number(value);
          const lng = Number(searchParams.get("lng"));
          acc.coordinates = [lng, lat]; // Mapbox expects [lng, lat] format
        } else if (key !== "lng") {
          // Skip lng as we handle it with lat
          acc[key] = value === "any" ? null : value;
        }

        return acc;
      },
      {}
    );

    const cleanedFilters = cleanParams(initialFilters);
    console.log("Updating filters from URL params:", cleanedFilters);
    dispatch(setFilters(cleanedFilters));
  }, [searchParams, dispatch]);

  return (
    <>
      <FiltersBar />
      <div className="flex justify-between flex-1 overflow-hidden gap-3 mb-5">
        <div
          className={`h-full overflow-auto transition-all duration-300 ease-in-out ${
            isFiltersFullOpen
              ? "w-3/12 opacity-100 visible"
              : "w-0 opacity-0 invisible"
          }`}
        >
          <FiltersFull />
        </div>
        <Map />
        <div className="basis-4/12 overflow-y-auto">
          <Listings />
        </div>
      </div>
    </>
  );
};

export default SearchContent;