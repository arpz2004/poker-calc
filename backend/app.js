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

async function getPokerEval(player1Hand, player2Hand, flop, beatTheDealerMode) {
  const array = player1Hand.concat(player2Hand).concat(flop);
  const data = await binding.pokerEval(array, beatTheDealerMode);
  return data;
}

app.post("/api/pokerEval", (req, res, next) => {
  ({ player1Hand, player2Hand, flop, beatTheDealerMode } = req.body);
  getPokerEval(player1Hand, player2Hand, flop, beatTheDealerMode).then((data) =>
    res.status(200).json({
      equity: data,
    })
  );
});

module.exports = app;
