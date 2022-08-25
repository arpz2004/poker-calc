const express = require("express");
const bodyParser = require("body-parser");
const binding = require("bindings")("native");

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS"
  );
  next();
});

async function getSimulationStatus() {
  const data = await binding.getSimulationStatus();
  return data;
}

app.post("/api/getSimulationStatus", (req, res, next) => {
  getSimulationStatus().then((data) => {
    res.status(200).json({
      currentSimulationNumber: data.currentSimulationNumber,
      numberOfSimulations: data.numberOfSimulations
    });
  });
});

const uthSimulationResponse = (res) => (profit, edge, cards, error) => {
  if (error) {
    res.status(500).json({ message: error });
  } else {
    res.status(200).json({
      profit, edge, ...cards
    });
  }
}

async function runUthSimulations(res, numberOfSimulations) {
  const data = await binding.runUthSimulations([], numberOfSimulations, 1, 1, 0, uthSimulationResponse(res));
  return data;
}

app.post("/api/runUthSimulations", (req, res, next) => {
  runUthSimulations(res, req.body.numberOfSimulations);
});

module.exports = app;
