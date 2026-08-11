import { loadEnvFile } from "node:process";
import { existsSync } from "node:fs";

if (existsSync(".env")) {
  loadEnvFile();
}
