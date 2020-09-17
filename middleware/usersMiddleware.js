const ExpressError = require("../helpers/expressError");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const jsonschema = require("jsonschema");
const userSchema = require("../schema/userSchema.json");
const userSchemaPatch = require("../schema/userSchemaPatch.json");
const User = require("../models/user");

function isVerified(req, res, next) {
  try {
    const { _token } = req.body;
    const verified = jwt.verify(_token, SECRET_KEY);
    req.username = verified.username;
    if (verified && req.method != "DELETE" && req.method != "PATCH") {
      return next();
    } else if (verified.is_admin) {
      return next();
    } else if (verified.is_admin == false) {
      throw new ExpressError(
        "You are not authorized to do that. Admins only.",
        401
      );
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
}
async function checkUserExistenceGet(req, res, next) {
  try {
    let username = req.params.username;
    const checkIfExist = await User.getUserAllColumns(username);
    if (checkIfExist) {
      if (req.method == "PATCH" || req.method == "DELETE") {
        if (req.username != checkIfExist.username) {
          throw new ExpressError(
            "You are not authorized to do that to this account",
            401
          );
        }
      }
      delete checkIfExist["password"];
      req.user = checkIfExist;
      return next();
    } else {
      throw new ExpressError("This user does not exist", 404);
    }
  } catch (error) {
    next(error);
  }
}

async function checkUserExistencePost(req, res, next) {
  try {
    let username;
    let email;
    if (req.method === "POST") {
      username = req.body.username;
      email = req.body.email;
    } else if (req.method == "PATCH") {
      if (req.body.username != req.params.username) {
        username = req.body.username;
      } else {
        username = null;
      }
      if (req.body.email != req.user.email) {
        email = req.body.email;
      } else {
        email = null;
      }
    }

    let checkIfUsernameTaken;
    let checkIfEmailTaken;
    if (username) {
      checkIfUsernameTaken = await User.getUser(username);
    }
    if (email) {
      checkIfEmailTaken = await User.getEmail(email);
    }
    if (!checkIfUsernameTaken && !checkIfEmailTaken) {
      return next();
    } else if (checkIfEmailTaken && checkIfUsernameTaken) {
      throw new ExpressError("Both username and email are not available", 409);
    } else if (checkIfUsernameTaken) {
      throw new ExpressError("Username not available", 409);
    } else if (checkIfEmailTaken) {
      throw new ExpressError("Email not available", 409);
    }
  } catch (error) {
    next(error);
  }
}

async function noExtraProperties(req, res, next) {
  try {
    let result;
    if (req.method == "POST") {
      result = jsonschema.validate(req.body, userSchema);
    } else {
      result = jsonschema.validate(req.body, userSchemaPatch);
    }

    for (let key in result.instance) {
      if (!userSchema.examples[0].hasOwnProperty(key) && key != "_token") {
        throw new ExpressError(
          `${key} is not a valid property for a user`,
          400
        );
      }
    }
    if (result.valid) {
      return next();
    } else {
      const listOfErrors = result.errors.map((error) => error.stack);
      const err = new ExpressError(listOfErrors, 400);
      return next(err);
    }
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  isVerified,
  checkUserExistencePost,
  checkUserExistenceGet,
  noExtraProperties,
};
