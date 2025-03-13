import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { wktToGeoJSON } from "@terraformer/wkt";

const prisma = new PrismaClient();


export const getTenant= async(req:Request, res:Response):Promise<void>=>{
    try {
        const {cognitoId} = req.params;

        const tenant = await prisma.tenant.findUnique({
            where:{cognitoId},
            include:{favorites:true}
        })

        if(tenant){
            res.json(tenant)
        } else{
            res.status(404).json({message:"Tenant not found"})
            
        }
        
    } catch (error) {
        res.status(500).json({message:"Something went wrong", error})
    }

}

export const createTenant = async(req:Request, res:Response):Promise<void>=>{
    try {
        const {cognitoId, name,email,phoneNumber }= req.body;
        const newTenant = await prisma.tenant.create({data:{cognitoId, name, email, phoneNumber}});
        res.status(201).json(newTenant);


    } catch (error) {
        res.status(500).json({message:"Something went wrong", error})
    }
}

export const updateTenant = async(req:Request, res:Response):Promise<void>=>{
    const {cognitoId} = req.params;
    const {name,email,phoneNumber} = req.body;
    try {
        const updateTenant = await prisma.tenant.update({
            where:{cognitoId},
            data:{
                name,
                email,
                phoneNumber

            },
        })

        res.status(200).json(updateTenant)
    } catch (error) {
        res.status(500).json({message:"Something went wrong", error})
    }
}

export const getCurrentResidences = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { cognitoId } = req.params;
      const properties = await prisma.property.findMany({
        where: { tenants: { some: { cognitoId } } },
        include: {
          location: true,
        },
      });
  
      const residencesWithFormattedLocation = await Promise.all(
        properties.map(async (property) => {
          const coordinates: { coordinates: string }[] =
            await prisma.$queryRaw`SELECT ST_asText(coordinates) as coordinates from "Location" where id = ${property.location.id}`;
  
          const geoJSON: any = wktToGeoJSON(coordinates[0]?.coordinates || "");
          const longitude = geoJSON.coordinates[0];
          const latitude = geoJSON.coordinates[1];
  
          return {
            ...property,
            location: {
              ...property.location,
              coordinates: {
                longitude,
                latitude,
              },
            },
          };
        })
      );
  
      res.json(residencesWithFormattedLocation);
    } catch (err: any) {
      res
        .status(500)
        .json({ message: `Error retrieving manager properties: ${err.message}` });
    }
  };


  export const addFavoriteProperty = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      // Step 1: Get the tenant's ID and the property's ID from the request
      const { cognitoId, propertyId } = req.params;
  
      // Step 2: Find the tenant in the database using their ID
      const tenant = await prisma.tenant.findUnique({
        where: { cognitoId }, // Look for the tenant with this ID
        include: { favorites: true }, // Include their list of favorite properties
      });
  
      // If the tenant doesn't exist, say "Tenant not found" and stop
      if (!tenant) {
        res.status(404).json({ message: "Tenant not found" });
        return;
      }
  
      // Step 3: Convert the property ID to a number
      const propertyIdNumber = Number(propertyId);
  
      // Get the tenant's current list of favorite properties
      const existingFavorites = tenant.favorites || [];
  
      // Step 4: Check if the property is already in their favorites
      if (!existingFavorites.some((fav) => fav.id === propertyIdNumber)) {
        // If not, add the property to their favorites
        const updatedTenant = await prisma.tenant.update({
          where: { cognitoId }, // Find the tenant again
          data: {
            favorites: {
              connect: { id: propertyIdNumber }, // Add the property to their favorites
            },
          },
          include: { favorites: true }, // Include the updated list of favorites
        });
  
        // Step 5: Send the updated list of favorites back to the tenant
        res.json(updatedTenant);
      } else {
        // If the property is already a favorite, say "Property already added"
        res.status(409).json({ message: "Property already added as favorite" });
      }
    } catch (error: any) {
      // Step 6: If something goes wrong, say "Oops, something went wrong!" and explain the error
      res
        .status(500)
        .json({ message: `Error adding favorite property: ${error.message}` });
    }
  };
  
  export const removeFavoriteProperty = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { cognitoId, propertyId } = req.params;
      const propertyIdNumber = Number(propertyId);
  
      const updatedTenant = await prisma.tenant.update({
        where: { cognitoId },
        data: {
          favorites: {
            disconnect: { id: propertyIdNumber },
          },
        },
        include: { favorites: true },
      });
  
      res.json(updatedTenant);
    } catch (err: any) {
      res
        .status(500)
        .json({ message: `Error removing favorite property: ${err.message}` });
    }
  };