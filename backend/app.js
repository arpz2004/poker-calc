const express = require("express");
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);
const binding = require("bindings")("native");

const app = express();

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

async function getPokerEval() {
  console.log("called PokerEval");
  const array = new Int32Array([39, 23, 46, 7, 26, 33, 9]);
  const data = await binding.pokerEval(array.buffer);
  return data;
}

app.get("/api/pokerEval", (req, res, next) => {
  getPokerEval().then((data) =>
    res.status(200).json({
      player1Results: [...data.player1Results],
      player2Results: [...data.player2Results],
    })
  );
});

module.exports = app;
