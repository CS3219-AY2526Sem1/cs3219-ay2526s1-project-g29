import express from "express";
import { createServer } from "http";
import matchRoutes from "./routes/match-routes.js";
import { attachWebsocket } from "./middleware/ws-server.js";

const app = express();
app.use(express.json());

// Healthcheck
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", service: "matching-service", timestamp: new Date().toISOString() });
});

// Mount API routes at root
app.use("/", matchRoutes);

// create server + attach WS
const server = createServer(app);
attachWebsocket(server);

// Read MATCHING_PORT first, then PORT, then default 8080
const PORT = Number(process.env.MATCHING_PORT || process.env.PORT || 8080);
server.listen(PORT, () => {
  console.log(`Matching service running on port ${PORT}`);
});