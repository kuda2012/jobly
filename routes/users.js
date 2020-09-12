const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../helpers/expressError");
const jsonschema = require("jsonschema");
const userSchema = require("../schema/userSchema.json");
const userSchemaPatch = require("../schema/userSchemaPatch.json");
const sqlForPartialUpdate = require("../helpers/partialUpdate");
const User = require("../models/user");
const { isEqual } = require("lodash");
const jwt = require("jsonwebtoken");

router.post("/login", async (req, res, next) => {
  try {
    const loginSuccessful = await User.getLoggedIn(req.body);
    return res.json({ token: loginSuccessful });
  } catch (error) {
    next(error);
  }
});

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
        await newUser.create(req.body);
        const token = await User.getLoggedIn(req.body);
        return res.json({ token: token });
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
    const username = req.params.username.toLowerCase();
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
router.patch("/:username", async (req, res, next) => {
  try {
    const result = jsonschema.validate(req.body, userSchemaPatch);
    for (let key in result.instance) {
      if (!userSchemaPatch.examples[0].hasOwnProperty(key)) {
        throw new ExpressError(`${key} is not a valid property for a job`, 400);
      }
    }
    if (result.valid) {
      const username = req.params.username.toLowerCase();
      const checkIfExist = await User.getUser(username);
      if (checkIfExist) {
        if (Object.keys(req.body).length == 0) {
          return res.json({ msg: "User unchanged", user: checkIfExist });
        }
        let checkIfUsernameTaken;
        let checkIfEmailTaken;
        if (req.body.username) {
          checkIfUsernameTaken = await User.getUser(req.body.username);
        }

        if (req.body.email) {
          checkIfEmailTaken = await User.getEmail(req.body.email);
        }

        if (
          checkIfUsernameTaken &&
          !isEqual(checkIfUsernameTaken, checkIfExist)
        ) {
          throw new ExpressError("Username is already taken", 409);
        } else if (
          checkIfEmailTaken &&
          !isEqual(checkIfEmailTaken, checkIfExist)
        ) {
          throw new ExpressError("Email is already taken", 409);
        } else {
          if (req.body.email) req.body.email = req.body.email.toLowerCase();

          if (req.body.username)
            req.body.username = req.body.username.toLowerCase();
          const user = await sqlForPartialUpdate(
            "users",
            req.body,
            "username",
            username
          );
          if (isEqual(user.query.rows[0], checkIfExist)) {
            return res.json({
              msg: "User unchanged",
              user: checkIfExist,
            });
          }
          return res.json({ updated_user: user.query.rows[0] });
        }
      } else {
        throw new ExpressError("This user does not exist", 404);
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
router.delete("/:username", async (req, res, next) => {
  try {
    const username = req.params.username.toLowerCase();
    const checkIfExist = await User.getUser(username);
    if (checkIfExist) {
      const deleteUser = new User();
      const deletedUser = await deleteUser.delete(username);
      return res.json({
        msg: `The user with username ${deletedUser.username} has been deleted`,
      });
    } else {
      throw new ExpressError("This User does not exist", 404);
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
