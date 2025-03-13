import express from "express"
import { authMiddleware } from "../middleware/authMiddleware";
import multer from "multer";
import { createProperty, getProperties, getProperty, getPropertyLease } from "../controllers/propertyControllers";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();
router.get('/', getProperties) 
router.get('/:id', getProperty) 
router.get("/:propertyId/leases", authMiddleware(["manager"]), getPropertyLease);
router.post("/", authMiddleware(["manager"]),upload.array("photos") ,createProperty)


export default router;