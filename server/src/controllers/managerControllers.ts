import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { wktToGeoJSON } from "@terraformer/wkt";

const prisma = new PrismaClient();



export const getManager= async(req:Request, res:Response):Promise<void>=>{
    try {
        const {cognitoId} = req.params;

        const tenant = await prisma.manager.findUnique({
            where:{cognitoId},
           
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

export const createManager = async(req:Request, res:Response):Promise<void>=>{
    try {
        const {cognitoId, name,email,phoneNumber }= req.body;
        const newTenant = await prisma.manager.create({data:{cognitoId, name, email, phoneNumber}});
        res.status(201).json(newTenant);


    } catch (error) {
        res.status(500).json({message:"Something went wrong", error})
    }
}

export const updateManager = async(req:Request, res:Response):Promise<void>=>{
    const {cognitoId} = req.params;
    const {name,email,phoneNumber} = req.body;
    try {
        const updateManager = await prisma.manager.update({
            where:{cognitoId},
            data:{
                name,
                email,
                phoneNumber

            },
        })

        res.status(200).json(updateManager)
    } catch (error) {
        res.status(500).json({message:"Something went wrong", error})
    }
}


export const getManagerProperties = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { cognitoId } = req.params;
      const properties = await prisma.property.findMany({
        where: { managerCognitoId: cognitoId },
        include: {
          location: true,
        },
      });
  
      const propertiesWithFormattedLocation = await Promise.all(
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
  
      res.json(propertiesWithFormattedLocation);
    } catch (err: any) {
      res
        .status(500)
        .json({ message: `Error retrieving manager properties: ${err.message}` });
    }
  };