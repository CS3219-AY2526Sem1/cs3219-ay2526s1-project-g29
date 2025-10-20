import express from "express";
import { createServer } from "http";
import matchRoutes from "./routes/match-routes.js";
import { attachWebsocket } from "./middleware/ws-server.js";
import { connectRabbitMQ, closeRabbitMQ } from "./utils/rabbitmq.js";
import { startMatchProcessor } from "./services/match-processor.js";

const app = express();
app.use(express.json());

// Add JSON parse error handler
app.use((err, req, res, next) => {
  if (err && err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }
  next(err);
});

// Healthcheck
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "matching-service",
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use("/", matchRoutes);

// Create server + attach WS
const server = createServer(app);
attachWebsocket(server);

const PORT = Number(process.env.MATCHING_PORT || process.env.PORT || 8002);

// Start server with RabbitMQ
async function start() {
  try {
    // Connect to RabbitMQ
    await connectRabbitMQ();
    
    // Start match processor
    await startMatchProcessor();
    
    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`Matching service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start matching service:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await closeRabbitMQ();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await closeRabbitMQ();
  process.exit(0);
});

start();