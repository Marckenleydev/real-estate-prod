import express from "express"
import { createTenant, getTenant,updateTenant} from "../controllers/tenantControllers";

const router = express.Router();
router.get('/:cognitoId', getTenant) 
router.post("/", createTenant)
router.put("/:cognitoId", updateTenant)

export default router;