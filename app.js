/** Express app for jobly. */

const express = require("express");

const ExpressError = require("./helpers/expressError");

const morgan = require("morgan");

const app = express();

app.use(express.json());

// add logging system

app.use(morgan("tiny"));

/** 404 handler */

const companiesRoutes = require("./routes/companies");

app.use("/companies", companiesRoutes);
app.use(function (req, res, next) {
  const err = new ExpressError("Not Found", 404);

  // pass the error to the next piece of middleware
  return next(err);
});

/** general error handler */

app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  console.error(err.stack);

  return res.json({
    message: err.message,
    status: err.status,
  });
});

module.exports = app;
