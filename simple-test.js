#!/usr/bin/env node
console.log("Testing file creation");
const fs = require("fs");
try {
  fs.writeFileSync("./test-output.txt", "Test succeeded", "utf8");
  console.log("File created successfully");
} catch (err) {
  console.error("Error creating file:", err);
}
