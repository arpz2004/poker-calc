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

async function getEquity(player1Hand, player2Hand, flop, beatTheDealerMode) {
  const data = await binding.getEquity(
    player1Hand,
    player2Hand,
    flop,
    beatTheDealerMode
  );
  return data;
}

app.post("/api/getEquity", (req, res, next) => {
  ({ player1Hand, player2Hand, flop, beatTheDealerMode } = req.body);
  getEquity(player1Hand, player2Hand, flop, beatTheDealerMode).then((data) =>
    res.status(200).json({
      equity: data,
    })
  );
});

module.exports = app;
