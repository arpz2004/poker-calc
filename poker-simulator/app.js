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

const uthSimulationResponse = (res) => (profit, edge, stDev, cards, error) => {
  if (error) {
    res.status(500).json({ message: error });
  } else {
    res.status(200).json({
      profit, edge, stDev, ...cards
    });
  }
}

async function runUthSimulations(res, numberOfSimulations, handsPerSession, knownDealerCards, knownFlopCards, knownTurnRiverCards) {
  const data = await binding.runUthSimulations([], numberOfSimulations, handsPerSession, knownDealerCards, knownFlopCards, knownTurnRiverCards, uthSimulationResponse(res));
  return data;
}

app.post("/api/runUthSimulations", (req, res, next) => {
  const { numberOfSimulations, handsPerSession, knownDealerCards, knownFlopCards, knownTurnRiverCards } = req.body;
  // Use default values if not provided
  const dealerCards = knownDealerCards !== undefined ? knownDealerCards : 0;
  const flopCards = knownFlopCards !== undefined ? knownFlopCards : 0;
  const turnRiverCards = knownTurnRiverCards !== undefined ? knownTurnRiverCards : 0;
  runUthSimulations(res, numberOfSimulations, handsPerSession, dealerCards, flopCards, turnRiverCards);
});

module.exports = app;
