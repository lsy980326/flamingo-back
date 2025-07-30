import { Kafka, Producer, Admin, Partitioners, SASLOptions } from "kafkajs";

const isProduction = process.env.NODE_ENV === "production";
console.log(
  `[Kafka Producer] Running in ${
    isProduction ? "PRODUCTION" : "DEVELOPMENT"
  } mode.`
);

let kafka: Kafka;

if (isProduction) {
  const sasl: SASLOptions = {
    mechanism: "scram-sha-512",
    username: process.env.KAFKA_USERNAME!,
    password: process.env.KAFKA_PASSWORD!,
  };

  const kafka = new Kafka({
    clientId: "flamingo-api-server",
    brokers: process.env.KAFKA_BROKERS!.split(",").map((b) => b.trim()),
    ssl: true,
    connectionTimeout: 5000,
    requestTimeout: 30000,
  });
} else {
  // --- 로컬 개발 환경 설정 ---
  kafka = new Kafka({
    clientId: "flamingo-api-server-local",
    brokers: ["localhost:29092"], // 하드코딩된 로컬 주소 사용
  });
}

const admin: Admin = kafka.admin({
  retry: {
    initialRetryTime: 300,
    retries: 5,
  },
});
const producer: Producer = kafka.producer({
  createPartitioner: Partitioners.DefaultPartitioner,
  retry: {
    initialRetryTime: 300,
    retries: 5,
  },
});

const topicsToEnsure = ["PROJECTS_V1", "COLLABORATORS_V1"];

export const initializeKafkaProducer = async () => {
  try {
    // Admin 클라이언트 연결
    await admin.connect();
    console.log("✅ Kafka Admin connected");

    const existingTopics = await admin.listTopics();
    console.log("Existing Kafka topics:", existingTopics);

    const topicsToCreate = topicsToEnsure.filter(
      (topic) => !existingTopics.includes(topic)
    );

    if (topicsToCreate.length > 0) {
      console.log(`Creating topics: ${topicsToCreate.join(", ")}`);
      await admin.createTopics({
        waitForLeaders: true,
        topics: topicsToCreate.map((topic) => ({
          topic: topic,
          numPartitions: 3,
          replicationFactor: 2,
        })),
      });
      console.log("Topics created successfully.");
    }

    await admin.disconnect();
    console.log("❌ Kafka Admin disconnected");

    // Producer 연결
    await producer.connect();
    console.log("✅ Kafka Producer connected");
  } catch (error) {
    console.error(
      "❌ Failed to initialize Kafka Producer or create topics:",
      error
    );
    process.exit(1);
  }
};

export const disconnectProducer = async () => {
  // admin 클라이언트도 연결 해제 시도 (이미 해제되었을 수 있지만 안전을 위해)
  try {
    await admin.disconnect();
  } catch (e) {}
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
