"use client";
import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useAppSelector } from "@/state/redux";
import { useGetPropertiesQuery } from "@/state/api";
import { Property } from "@/types/prismaTypes";
import { useSearchParams } from "next/navigation";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string;

const Map = () => {
  const searchParams = useSearchParams();
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const mapContainerRef = useRef(null);
  const filters = useAppSelector((state) => state.global.filters);
  const {
    data: properties,
    isLoading,
    isError,
  } = useGetPropertiesQuery(filters);

  useEffect(() => {
    if (isLoading || isError || !properties || !mapContainerRef.current) return;

    // Define a fallback center as a tuple [lng, lat]
    let center: [number, number] = [-74.5, 40]; // Default fallback coordinates
    
    if (filters.coordinates && Array.isArray(filters.coordinates) && filters.coordinates.length === 2) {
      // Validate coordinates before using them
      const [longitude, latitude] = filters.coordinates;
      if (
        isValidCoordinate(longitude, -180, 180) && 
        isValidCoordinate(latitude, -90, 90)
      ) {
        center = [longitude, latitude] as [number, number];
      } else {
        console.warn("Invalid coordinates in filters, using default center");
      }
    } else if (lng && lat) {
      // Try to use URL params if available and valid
      const lngFloat = parseFloat(lng);
      const latFloat = parseFloat(lat);
      if (
        isValidCoordinate(lngFloat, -180, 180) && 
        isValidCoordinate(latFloat, -90, 90)
      ) {
        center = [lngFloat, latFloat];
      }
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/marckenley/cm84xl08c004j01s90udg21d1",
      center: center,
      zoom: 9,
    });

    // Add markers for valid property coordinates only
    properties.forEach((property) => {
      try {
        if (
          property.location?.coordinates &&
          isValidCoordinate(property.location.coordinates.longitude, -180, 180) &&
          isValidCoordinate(property.location.coordinates.latitude, -90, 90)
        ) {
          const marker = createPropertyMarker(property, map);
          const markerElement = marker.getElement();
          const path = markerElement.querySelector("path[fill='#3FB1CE']");
          if (path) path.setAttribute("fill", "#000000");
        } else {
          console.warn(`Invalid coordinates for property: ${property.id}`);
        }
      } catch (error) {
        console.error(`Error creating marker for property ${property.id}:`, error);
      }
    });

    const resizeMap = () => {
      if (map) setTimeout(() => map.resize(), 700);
    };
    resizeMap();

    return () => map.remove();
  }, [isLoading, isError, properties, filters.coordinates, lat, lng]);

  // Helper function to validate coordinates
  const isValidCoordinate = (value: number, min: number, max: number): boolean => {
    return !isNaN(value) && value >= min && value <= max;
  };

  if (isLoading) return <>Loading...</>;
  if (isError || !properties) return <div>Failed to fetch properties</div>;

  return (
    <div className="basis-5/12 grow relative rounded-xl">
      <div
        className="map-container rounded-xl"
        ref={mapContainerRef}
        style={{
          height: "100%",
          width: "100%",
        }}
      />
    </div>
  );
};

const createPropertyMarker = (property: Property, map: mapboxgl.Map) => {
  // Ensure we have valid coordinates as a tuple
  const coordinates: [number, number] = [
    property.location.coordinates.longitude,
    property.location.coordinates.latitude
  ];
  
  const marker = new mapboxgl.Marker()
    .setLngLat(coordinates)
    .setPopup(
      new mapboxgl.Popup().setHTML(
        `
        <div class="marker-popup">
          <div class="marker-popup-image"></div>
          <div>
            <a href="/search/${property.id}" target="_blank" class="marker-popup-title">${property.name}</a>
            <p class="marker-popup-price">
              $${property.pricePerMonth}
              <span class="marker-popup-price-unit"> / month</span>
            </p>
          </div>
        </div>
        `
      )
    )
    .addTo(map);
  return marker;
};

export default Map;