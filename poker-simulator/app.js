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

async function runUthSimulations(numberOfSimulations) {
  const data = await binding.runUthSimulations([], numberOfSimulations);
  return data;
}

app.post("/api/runUthSimulations", (req, res, next) => {
  runUthSimulations(req.body.numberOfSimulations).then((data) =>
    res.status(200).json({
      playerCards: data.playerCards,
      communityCards: data.communityCards,
      dealerCards: data.dealerCards,
      profit: data.profit,
      edge: data.edge
    })
  );
});

module.exports = app;
