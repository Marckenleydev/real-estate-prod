import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import bodyParser from "body-parser";
import fetch from "node-fetch"
import { authMiddleware } from "../middleware/authMiddleware";


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
import tenantRoutes from "./routes/tenantRoutes"
import managerRoutes from "./routes/managerRoutes"
// Routes
app.get("/",  (req, res) => {
  res.send("Hello World!");
});

app.use("/api/tenants", authMiddleware(["tenant"]), tenantRoutes)
app.use("/api/managers", authMiddleware(["manager"]), managerRoutes)

const PORT = process.env.PORT  || 3003;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});