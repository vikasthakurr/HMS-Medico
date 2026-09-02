import amqp from 'amqplib';

let channel = null;

export const connect = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();
    console.log('RabbitMQ connected');
  } catch (err) {
    console.log('RabbitMQ not available, skipping...', err.message);
  }
};

export const publish = async (exchange, routingKey, data) => {
  if (!channel) return;
  await channel.assertExchange(exchange, 'topic', { durable: true });
  channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(data)));
};

export const subscribe = async (exchange, queue, routingKey, handler) => {
  if (!channel) return;
  await channel.assertExchange(exchange, 'topic', { durable: true });
  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, exchange, routingKey);

  channel.consume(queue, async (msg) => {
    if (msg) {
      const data = JSON.parse(msg.content.toString());
      await handler(data);
      channel.ack(msg);
    }
  });
};
