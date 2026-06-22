import { createClient } from "redis";
import { REDIS_CONNECTION } from "../constants/env";

const client = createClient({ url: REDIS_CONNECTION });

client.on("error", (err) => {
  console.log("redis client error", err);
});

export async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
    console.log("redis connected");
  }
}

export { client };
