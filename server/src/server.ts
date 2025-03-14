import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import bodyParser from "body-parser";
import { authMiddleware } from "./middleware/authMiddleware";


// Configuration
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

// Routes
import tenantRoutes from "./routes/tenantRoutes"
import managerRoutes from "./routes/managerRoutes"
import propertyRoutes from "./routes/propertyRoutes"
import leaseRoutes from "./routes/leaseRoutes"
import applicationRoutes from "./routes/applicationRoutes"



// Routes
app.get("/",  (req, res) => {
  res.send("Hello welcome to RENTiful");
});
app.use("/api/applications", applicationRoutes);
app.use("/api/properties", propertyRoutes)
app.use("/api/leases", leaseRoutes);
app.use("/api/tenants", authMiddleware(["tenant"]), tenantRoutes)
app.use("/api/managers", authMiddleware(["manager"]), managerRoutes)

const PORT = Number(process.env.PORT)  || 3003;
app.listen(PORT,"0.0.0.0", () => {

  console.log(`Server is running on port ${PORT}`);

});