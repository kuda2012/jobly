const ExpressError = require("../helpers/expressError");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const jsonschema = require("jsonschema");
const companySchema = require("../schema/companySchema.json");
const companySchemaPatch = require("../schema/companySchemaPatch.json");
const Company = require("../models/company");

function isVerified(req, res, next) {
  try {
    const { _token } = req.body;
    const verified = jwt.verify(_token, SECRET_KEY);
    if (
      verified &&
      req.method != "POST" &&
      req.method != "PATCH" &&
      req.method != "POST"
    ) {
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

async function checkCompanyExistenceGet(req, res, next) {
  try {
    let handle = req.params.handle;
    if (handle) {
      handle = handle.toLowerCase();
    }
    const checkIfExist = await Company.getOne(handle);
    if (checkIfExist) {
      req.initial_company = checkIfExist;
      return next();
    } else {
      throw new ExpressError("This company does not exist", 404);
    }
  } catch (error) {
    next(error);
  }
}
async function checkCompanyExistencePost(req, res, next) {
  try {
    if (Object.keys(req.body).length == 1) {
      return res.json({
        msg: "Company unchanged",
        company: req.initial_company,
      });
    }
    let handle = req.body.handle;
    if (handle) {
      handle = handle.toLowerCase();
    }

    const checkIfExist = await Company.getOne(handle, true);
    if (checkIfExist) {
      req.other_company = checkIfExist;
      return next();
    } else if (req.method == "POST" && !checkIfExist) {
      return next();
    } else {
      throw new ExpressError("This company does not exist", 404);
    }
  } catch (error) {
    next(error);
  }
}

async function noExtraProperties(req, res, next) {
  try {
    let result;
    if (req.method == "POST") {
      result = jsonschema.validate(req.body, companySchema);
    } else {
      result = jsonschema.validate(req.body, companySchemaPatch);
    }

    for (let key in result.instance) {
      if (!companySchema.examples[0].hasOwnProperty(key) && key != "_token") {
        throw new ExpressError(
          `${key} is not a valid property for a company`,
          400
        );
      }
      if (result.valid) {
        return next();
      } else {
        const listOfErrors = result.errors.map((error) => error.stack);
        const err = new ExpressError(listOfErrors, 400);
        return next(err);
      }
    }
  } catch (error) {
    return next(error);
  }
}
module.exports = {
  isVerified,
  checkCompanyExistenceGet,
  checkCompanyExistencePost,
  noExtraProperties,
};
