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
const { SECRET_KEY } = require("../config");

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
        throw new ExpressError(
          `${key} is not a valid property for a user`,
          400
        );
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
      } else if (checkIfEmailTaken && checkIfUsernameTaken) {
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
    const checkIfExist = await User.getUserAllColumns(username);
    if (checkIfExist) {
      delete checkIfExist["password"];
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
    const { _token } = req.body;
    const verified = jwt.verify(_token, SECRET_KEY);
    if (verified) {
      const result = jsonschema.validate(req.body, userSchemaPatch);
      for (let key in result.instance) {
        if (
          !userSchemaPatch.examples[0].hasOwnProperty(key) &&
          key != "_token"
        ) {
          throw new ExpressError(
            `${key} is not a valid property for a user`,
            400
          );
        }
      }
      if (result.valid) {
        const username = req.params.username.toLowerCase();
        const checkIfExist = await User.getUser(username);
        if (checkIfExist) {
          const userAllColumns = await User.getUserAllColumns(username);
          if (Object.keys(req.body).length == 1) {
            delete userAllColumns["password"];
            return res.json({
              msg: "User unchanged",
              user: userAllColumns,
            });
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
            delete req.body["password"];
            // not allowed to change pasword in patch request
            const user = await sqlForPartialUpdate(
              "users",
              req.body,
              "username",
              username
            );
            if (isEqual(user.query.rows[0], userAllColumns)) {
              delete userAllColumns["password"];
              return res.json({
                msg: "User unchanged",
                user: userAllColumns,
              });
            }
            delete user.query.rows[0]["password"];
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
    } else {
      throw new ExpressError(
        "You are not authorized to go here, please login first",
        401
      );
    }
  } catch (error) {
    if (
      error.message == "invalid token" ||
      error.message == "invalid signature"
    ) {
      error.status = 400;
    }
    next(error);
  }
});
router.delete("/:username", async (req, res, next) => {
  try {
    const { _token } = req.body;
    const verified = jwt.verify(_token, SECRET_KEY);
    if (verified) {
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
    } else {
      throw new ExpressError(
        "You are not authorized to go here, please login first",
        401
      );
    }
  } catch (error) {
    if (
      error.message == "invalid token" ||
      error.message == "invalid signature"
    ) {
      error.status = 400;
    }
    next(error);
  }
});

module.exports = router;
