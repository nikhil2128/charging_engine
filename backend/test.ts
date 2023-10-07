import { performance } from "perf_hooks";
import supertest from "supertest";
import { buildApp } from "./app";

const app = supertest(buildApp());

async function basicLatencyTest() {
    await app.post("/reset").expect(204);
    const start = performance.now();
    await app.post("/charge").expect(200);
    await app.post("/charge").expect(200);
    await app.post("/charge").expect(200);
    await app.post("/charge").expect(200);
    await app.post("/charge").expect(200);
    console.log(`Latency: ${performance.now() - start} ms`);
}

async function businessLogicTest() {
  await app.post("/reset").expect(204);
  const start = performance.now();
  await app.post("/charge").send({
    "charges": 15 
  }).expect(200).expect({ isAuthorized: true, remainingBalance: 85, charges: 15 });
  await app.post("/charge").send({
    "charges": 86 
  }).expect(200).expect({ isAuthorized: false, remainingBalance: 85, charges: 0 });
  
  console.log(`Latency: ${performance.now() - start} ms`);
}

async function businessLogicConcurrencyTest() {
  await app.post("/reset").expect(204);
  const start = performance.now();
  await Promise.all([
    app.post("/charge").send({
      "charges": 15 
    }).expect(200).expect({ isAuthorized: true, remainingBalance: 85, charges: 15 }),
    app.post("/charge").send({
      "charges": 86 
    }).expect(200).expect({ isAuthorized: false, remainingBalance: 85, charges: 0 }),
    app.post("/charge").send({
      "charges": 86 
    }).expect(200).expect({ isAuthorized: false, remainingBalance: 85, charges: 0 }),
    app.post("/charge").send({
      "charges": 86 
    }).expect(200).expect({ isAuthorized: false, remainingBalance: 85, charges: 0 }),
    app.post("/charge").send({
      "charges": 86 
    }).expect(200).expect({ isAuthorized: false, remainingBalance: 85, charges: 0 })
  ]);  
  console.log(`Latency: ${performance.now() - start} ms`);
}

async function runTests() {
    await basicLatencyTest();
    await businessLogicTest()
    await businessLogicConcurrencyTest()
}

runTests().catch(console.error);
