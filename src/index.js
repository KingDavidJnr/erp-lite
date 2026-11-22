import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import prisma from "./lib/prisma.js";
import routes from "./routes/index.route.js";
//import { swaggerSpec, swaggerUi } from "./swagger.js";

// Initialize express.js app
const app = express();

// Converts all big int to strings globally
BigInt.prototype.toJSON = function () {
  return this.toString();
};

// Update the numbers if the number of proxies increase
app.set("trust proxy", 1);

// Define Global Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: [
      "https://bbayo.monesize.com",
      "https://bbayo.vercel.app",
      "https://bbayo.lovable.app",
      "http://localhost:8080",
    ],
    credentials: true, // Allow cookies and authentication headers
  }),
);

app.use(cookieParser()); // Parse cookies in request headers
app.use(morgan("common"));
app.use(helmet());

// Swagger UI setup
//app.use("/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Define the base of all routes
app.use("/v1", routes);

// Simple test route to verify the app is working
app.get("/", (req, res) => {
  res.status(200).send("Hello, world! BBayo backend app is running!");
});

// simple route to check API version
app.get("/v1", (req, res) => {
  res.status(200).send("BBayo Backend API v1.0.0 is up and running!");
});

// Get the port from environment variables (default to 4141 if not set)
const port = process.env.PORT || 4000;

// Start the server
async function startServer() {
  try {
    await prisma.$connect(); // 🔌 Try connecting to the DB
    console.log("Connected to the database");

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.error("Failed to connect to the database", err);
    process.exit(1); // Exit process if DB connection fails
  }
}

startServer();

export default app;
