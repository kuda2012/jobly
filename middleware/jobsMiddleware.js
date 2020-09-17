const ExpressError = require("../helpers/expressError");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const jsonschema = require("jsonschema");
const jobSchema = require("../schema/jobSchema.json");
const jobSchemaPatch = require("../schema/jobSchemaPatch.json");
const Job = require("../models/job");
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
    if (
      error.message == "invalid token" ||
      error.message == "invalid signature"
    ) {
      error.status = 400;
    }
    if (error.code == "23503") {
      error.message =
        "The company_handle entered is not an existing handle for a company";
      error.status = 400;
    }
    next(error);
  }
}

async function checkJobExistence(req, res, next) {
  try {
    let id = req.params.id;
    const checkIfExist = await Job.getOne(id);
    if (checkIfExist) {
      req.initial_job = checkIfExist;
      return next();
    } else {
      throw new ExpressError("This job does not exist", 404);
    }
  } catch (error) {
    next(error);
  }
}

async function checkCompanyExistence(req, res, next) {
  try {
    let handle = req.body.company_handle;
    if (handle) {
      handle = handle.toLowerCase();
    }
    const checkIfExist = await Company.getOne(handle, true);
    if (checkIfExist) {
      return next();
    } else {
      throw new ExpressError(
        "The company entered in the company_handle property does not exist",
        404
      );
    }
  } catch (error) {
    next(error);
  }
}

async function noExtraProperties(req, res, next) {
  try {
    let result;
    if (req.method == "POST") {
      result = jsonschema.validate(req.body, jobSchema);
    } else {
      result = jsonschema.validate(req.body, jobSchemaPatch);
    }

    for (let key in result.instance) {
      if (!jobSchema.examples[0].hasOwnProperty(key) && key != "_token") {
        throw new ExpressError(`${key} is not a valid property for a job`, 400);
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
function checkId(req, res, next) {
  const id = req.params.id;
  if (isNaN(id)) {
    throw new ExpressError("Please make sure job id is an integer", 400);
  }
  return next();
}
module.exports = {
  isVerified,
  checkJobExistence,
  checkCompanyExistence,
  noExtraProperties,
  checkId,
};
