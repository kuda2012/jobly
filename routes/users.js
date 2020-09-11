const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../helpers/expressError");
const jsonschema = require("jsonschema");
const userSchema = require("../schema/userSchema.json");
const userSchemaPatch = require("../schema/userSchemaPatch.json");
const sqlForPartialUpdate = require("../helpers/partialUpdate");
const User = require("../models/user");

router.post("/", async (req, res, next) => {
  try {
    const result = jsonschema.validate(req.body, userSchema);
    for (let key in result.instance) {
      if (!userSchema.examples[0].hasOwnProperty(key)) {
        throw new ExpressError(`${key} is not a valid property for a job`, 400);
      }
    }
    if (result.valid) {
      const checkIfUsernameTaken = await User.getUser(req.body.username);
      const checkIfEmailTaken = await User.getEmail(req.body.email);
      if (!checkIfUsernameTaken && !checkIfEmailTaken) {
        const newUser = new User();
        const user = await newUser.create(req.body);
        return res.json({ user: user });
      } else if (checkIfEmailTaken && checkIfEmailTaken) {
        throw new ExpressError(
          "Both username and email are not available",
          409
        );
      } else if (checkIfUsernameTaken) {
        throw new ExpressError("Username not available", 409);
      } else if (checkIfEmailTaken) {
        throw new ExpressError("Email not available", 409);
      }
    } else {
      const listOfErrors = result.errors.map((error) => error.stack);
      const err = new ExpressError(listOfErrors, 400);
      return next(err);
    }
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const users = await User.getAll();
    return res.json({ users });
  } catch (error) {
    next(error);
  }
});
router.get("/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    const checkIfExist = await User.getUser(username);
    if (checkIfExist) {
      return res.json({ user: checkIfExist });
    } else {
      throw new ExpressError("This user does not exist", 404);
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
