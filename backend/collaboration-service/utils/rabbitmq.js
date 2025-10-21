import amqp from 'amqplib';
import { env } from './env.js';

export async function connectRabbitMQ() {
  const { url, exchange } = env.rabbitmq;
  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();
  await channel.assertExchange(exchange, 'topic', { durable: true });

  connection.on('error', (error) => {
    console.error('[collaboration-service] RabbitMQ connection error', error);
  });

  connection.on('close', () => {
    console.warn('[collaboration-service] RabbitMQ connection closed');
  });

  return { connection, channel, exchange };
}

export async function closeRabbitMQ(context) {
  if (!context) return;
  const { channel, connection } = context;
  await Promise.allSettled([
    channel?.close?.(),
    connection?.close?.(),
  ]);
}
