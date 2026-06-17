import fs from "node:fs";
import { closeDatabase, getDatabaseFilePath, initializeDatabase } from "@/server/db";
import { ensureSeedData, resetAllData } from "@/server/portal-repository";

function main() {
  const command = process.argv[2] || "init";

  if (command === "init") {
    initializeDatabase();
    ensureSeedData();
    console.log(`Database ready: ${getDatabaseFilePath()}`);
    closeDatabase();
    return;
  }

  if (command === "seed") {
    initializeDatabase();
    resetAllData();
    console.log("Database reseeded");
    closeDatabase();
    return;
  }

  if (command === "reset") {
    closeDatabase();
    const filePath = getDatabaseFilePath();
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath, { force: true });
    }
    initializeDatabase();
    ensureSeedData();
    console.log(`Database reset: ${filePath}`);
    closeDatabase();
    return;
  }

  console.error(`Unknown db command: ${command}`);
  process.exit(1);
}

main();
