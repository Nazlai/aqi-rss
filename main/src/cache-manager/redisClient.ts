import { createClient, RedisClientType } from "redis";

class RedisClient {
  client: RedisClientType | null;

  constructor() {
    this.client = null;

    this.load = this.load.bind(this);
    this.connect = this.connect.bind(this);
    this.getClient = this.getClient.bind(this);
  }

  getClient() {
    if (this.client) {
      return this.client;
    }

    throw new Error("redis config not loaded");
  }

  load(redisConnection: string) {
    if (this.client) {
      throw new Error("redis client is already loaded");
    }

    this.client = createClient({ url: redisConnection });
    this.client.on("error", (err) => {
      console.log("redis client error", err);
    });
  }

  async connect() {
    if (!this.client) {
      throw new Error("redis config not loaded");
    }

    if (!this.client.isOpen) {
      await this.client.connect();
      console.log("redis connected");
    }
  }

  quit() {
    if (this.client) {
      this.client.close();
    }
  }
}

export const redisClient = new RedisClient();
