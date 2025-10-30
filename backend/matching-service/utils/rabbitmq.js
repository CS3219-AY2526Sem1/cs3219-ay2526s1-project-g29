import amqp from "amqplib";

let connection = null;
let channel = null;

const EXCHANGE_NAME = "matching_exchange";
const MATCH_REQUEST_QUEUE = "match_requests";
const MATCH_RESULT_QUEUE = "match_results";

export async function connectRabbitMQ() {
  const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://admin:admin@localhost:5672";
  
  try {
    connection = await amqp.connect(rabbitmqUrl);
    channel = await connection.createChannel();
    
    // Create exchange and queues
    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
    await channel.assertQueue(MATCH_REQUEST_QUEUE, { durable: true });
    await channel.assertQueue(MATCH_RESULT_QUEUE, { durable: true });
    
    console.log("RabbitMQ connected and queues created");
    
    // Handle connection errors
    connection.on("error", (err) => {
      console.error("RabbitMQ connection error:", err);
    });
    
    connection.on("close", () => {
      console.log("RabbitMQ connection closed");
    });
    
    return channel;
  } catch (error) {
    console.error("Failed to connect to RabbitMQ:", error);
    throw error;
  }
}

export function getChannel() {
  if (!channel) {
    throw new Error("RabbitMQ channel not initialized");
  }
  return channel;
}

export async function closeRabbitMQ() {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
  } catch (error) {
    console.error("Error closing RabbitMQ:", error);
  }
}

export { EXCHANGE_NAME, MATCH_REQUEST_QUEUE, MATCH_RESULT_QUEUE };