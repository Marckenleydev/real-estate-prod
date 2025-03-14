import { Request, Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { wktToGeoJSON } from "@terraformer/wkt";
import { S3Client } from "@aws-sdk/client-s3";
import axios from "axios";
import { Upload } from "@aws-sdk/lib-storage";
import { Location } from "@prisma/client";



const prisma = new PrismaClient();
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
  });

  export const createProperty = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      // Retrieve uploaded files using Multer
      const files = req.files as Express.Multer.File[];
      
      // Destructure request body to extract location details and property data
      const {
        address,
        city,
        state,
        country,
        postalCode,
        managerCognitoId,
        ...propertyData
      } = req.body;
  
      // Upload each image to AWS S3 and get their URLs
      
  
      // Construct geocoding API request to get coordinates based on address
      const geocodingUrl = `https://nominatim.openstreetmap.org/search?${new URLSearchParams(
        {
          street: address,
          city,
          country,
          postalcode: postalCode,
          format: "json",
          limit: "1",
        }
      ).toString()}`;
  
      // Fetch coordinates from the geocoding API
      const geocodingResponse = await axios.get(geocodingUrl, {
        headers: {
          "User-Agent": "RealEstateApp (justsomedummyemail@gmail.com)",
        },
      });
  
      // Extract longitude and latitude from the API response
      const [longitude, latitude] =
        geocodingResponse.data[0]?.lon && geocodingResponse.data[0]?.lat
          ? [
              parseFloat(geocodingResponse.data[0]?.lon),
              parseFloat(geocodingResponse.data[0]?.lat),
            ]
          : [0, 0]; // Default to (0,0) if location lookup fails
  
      // Insert a new location record into the database
      const [location] = await prisma.$queryRaw<Location[]>`
        INSERT INTO "Location" (address, city, state, country, "postalCode", coordinates)
        VALUES (${address}, ${city}, ${state}, ${country}, ${postalCode}, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326))
        RETURNING id, address, city, state, country, "postalCode", ST_AsText(coordinates) as coordinates;
      `;
  
      // Insert the new property record into the database
      const newProperty = await prisma.property.create({
        data: {
          ...propertyData,
           // Store the uploaded photo URLs
          locationId: location.id, // Associate the property with the new location
          managerCognitoId,
          amenities:
            typeof propertyData.amenities === "string"
              ? propertyData.amenities.split(",") // Convert comma-separated string into an array
              : [],
          highlights:
            typeof propertyData.highlights === "string"
              ? propertyData.highlights.split(",") // Convert comma-separated string into an array
              : [],
          isPetsAllowed: propertyData.isPetsAllowed === "true", // Convert string to boolean
          isParkingIncluded: propertyData.isParkingIncluded === "true", // Convert string to boolean
          pricePerMonth: parseFloat(propertyData.pricePerMonth), // Convert string to float
          securityDeposit: parseFloat(propertyData.securityDeposit), // Convert string to float
          applicationFee: parseFloat(propertyData.applicationFee), // Convert string to float
          beds: parseInt(propertyData.beds), // Convert string to integer
          baths: parseFloat(propertyData.baths), // Convert string to float
          squareFeet: parseInt(propertyData.squareFeet), // Convert string to integer
        },
        include: {
          location: true, // Include location details in the response
          manager: true, // Include manager details in the response
        },
      });
  
      // Respond with the newly created property
      res.status(201).json(newProperty);
    } catch (err: any) {
      // Handle errors and send a response
      res
        .status(500)
        .json({ message: `Error creating property: ${err.message}` });
    }
  };
  


// This is an asynchronous function to fetch a property's details, including its location coordinates.
export const getProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const property = await prisma.property.findUnique({
      where: { id: Number(id) },
      include: {
        location: true,
      },
    });

    if (property) {
      const coordinates: { coordinates: string }[] =
        await prisma.$queryRaw`SELECT ST_asText(coordinates) as coordinates from "Location" where id = ${property.location.id}`;

      const geoJSON: any = wktToGeoJSON(coordinates[0]?.coordinates || "");
      const longitude = geoJSON.coordinates[0];
      const latitude = geoJSON.coordinates[1];

      const propertyWithCoordinates = {
        ...property,
        location: {
          ...property.location,
          coordinates: {
            longitude,
            latitude,
          },
        },
      };
      res.json(propertyWithCoordinates);
    }
  } catch (err: any) {
    res
      .status(500)
      .json({ message: `Error retrieving property: ${err.message}` });
  }
};


export const getProperties = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      favoriteIds,
      priceMin,
      priceMax,
      beds,
      baths,
      propertyType,
      squareFeetMin,
      squareFeetMax,
      amenities,
      availableFrom,
      latitude,
      longitude,
    } = req.query;

    let whereConditions: Prisma.Sql[] = [];

    if (favoriteIds) {
      const favoriteIdsArray = (favoriteIds as string).split(",").map(Number);
      whereConditions.push(
        Prisma.sql`p.id IN (${Prisma.join(favoriteIdsArray)})`
      );
    }

    if (priceMin) {
      whereConditions.push(
        Prisma.sql`p."pricePerMonth" >= ${Number(priceMin)}`
      );
    }

    if (priceMax) {
      whereConditions.push(
        Prisma.sql`p."pricePerMonth" <= ${Number(priceMax)}`
      );
    }

    if (beds && beds !== "any") {
      whereConditions.push(Prisma.sql`p.beds >= ${Number(beds)}`);
    }

    if (baths && baths !== "any") {
      whereConditions.push(Prisma.sql`p.baths >= ${Number(baths)}`);
    }

    if (squareFeetMin) {
      whereConditions.push(
        Prisma.sql`p."squareFeet" >= ${Number(squareFeetMin)}`
      );
    }

    if (squareFeetMax) {
      whereConditions.push(
        Prisma.sql`p."squareFeet" <= ${Number(squareFeetMax)}`
      );
    }

    if (propertyType && propertyType !== "any") {
      whereConditions.push(
        Prisma.sql`p."propertyType" = ${propertyType}::"PropertyType"`
      );
    }

    if (amenities && amenities !== "any") {
      const amenitiesArray = (amenities as string).split(",");
      whereConditions.push(Prisma.sql`p.amenities @> ${amenitiesArray}`);
    }

    if (availableFrom && availableFrom !== "any") {
      const availableFromDate =
        typeof availableFrom === "string" ? availableFrom : null;
      if (availableFromDate) {
        const date = new Date(availableFromDate);
        if (!isNaN(date.getTime())) {
          whereConditions.push(
            Prisma.sql`EXISTS (
              SELECT 1 FROM "Lease" l 
              WHERE l."propertyId" = p.id 
              AND l."startDate" <= ${date.toISOString()}
            )`
          );
        }
      }
    }

    if (latitude && longitude) {
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const radiusInKilometers = 1000;
      const degrees = radiusInKilometers / 111; // Converts kilometers to degrees

      whereConditions.push(
        Prisma.sql`ST_DWithin(
          l.coordinates::geometry,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
          ${degrees}
        )`
      );
    }

    const completeQuery = Prisma.sql`
      SELECT 
        p.*,
        json_build_object(
          'id', l.id,
          'address', l.address,
          'city', l.city,
          'state', l.state,
          'country', l.country,
          'postalCode', l."postalCode",
          'coordinates', json_build_object(
            'longitude', ST_X(l."coordinates"::geometry),
            'latitude', ST_Y(l."coordinates"::geometry)
          )
        ) as location
      FROM "Property" p
      JOIN "Location" l ON p."locationId" = l.id
      ${
        whereConditions.length > 0
          ? Prisma.sql`WHERE ${Prisma.join(whereConditions, " AND ")}`
          : Prisma.empty
      }
    `;

    const properties = await prisma.$queryRaw(completeQuery);

    res.json(properties);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving properties: ${error.message}` });
  }
};


// Get leases for a specific property
export const getPropertyLease = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;

    if (!propertyId) {
      res.status(400).json({ message: "Property ID is required" });
    }

    const leases = await prisma.lease.findMany({
      where: {
        propertyId: Number(propertyId),
      },
      include: {
        tenant: true, // Include tenant details if needed
      },
    });

    res.json(leases);
  } catch (error) {
    console.error("Error fetching property leases:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


