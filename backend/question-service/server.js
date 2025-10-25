const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const questionRoutes = require("./routes/question-routes");

const app = express();
const PORT = process.env.QUESTION_PORT || process.env.PORT || 8003;

app.use(cors());
app.use(express.json());

// Lightweight health for diagnostics/healthchecks
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/questions", questionRoutes);

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.ENV !== "PROD" ? err.message : undefined,
  });
});

const getMongoURI = () => {
  if (process.env.ENV === "PROD") {
    return process.env.QUESTION_DB_CLOUD_URI;
  }
  return (
    process.env.QUESTION_DB_LOCAL_URI ||
    "mongodb://127.0.0.1:27017/peerprepQuestionServiceDB"
  );
};

const mongoURI = getMongoURI();

async function startServer() {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("MongoDB connected - Question Service DB");
    console.log(`   Environment: ${process.env.ENV || "DEV"}`);
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(
      `   Connection: ${
        process.env.ENV === "PROD" ? "MongoDB Atlas (Cloud)" : "Local MongoDB"
      }`
    );

    app.listen(PORT, () => {
      console.log(`Question Service running on port ${PORT}`);
      console.log(`   API endpoint: http://localhost:${PORT}/api/questions`);
    });
  } catch (err) {
    console.error("Failed to start Question Service:", err);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  console.log("\n\nShutting down...");
  await mongoose.connection.close();
  console.log("MongoDB connection closed");
  process.exit(0);
});

startServer();

module.exports = app;