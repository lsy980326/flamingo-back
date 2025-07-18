import { Kafka, Producer } from "kafkajs";

const kafka = new Kafka({
  clientId: "flamingo-api-server",
  brokers: [process.env.KAFKA_BROKERS!],
});

const producer: Producer = kafka.producer();

export const connectProducer = async () => {
  await producer.connect();
  console.log("✅ Kafka Producer connected");
};

export const disconnectProducer = async () => {
  await producer.disconnect();
  console.log("❌ Kafka Producer disconnected");
};

export const sendMessage = async (topic: string, message: object) => {
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  } catch (error) {
    console.error("Error sending message to Kafka", error);
  }
};
