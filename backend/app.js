const express = require("express");
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);

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
  const data = await exec(
    `node -e "require('./build/Release/native.node').pokerEval()`
  );
  console.log("Poker eval returned data: ", data);
  return data;
}

app.get("/api/pokerEval", (req, res, next) => {
  getPokerEval().then((data) =>
    res.status(200).json({
      eval: data.stdout,
      errors: data.stderr,
    })
  );
});

module.exports = app;
