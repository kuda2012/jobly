const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../helpers/expressError");
const jsonschema = require("jsonschema");
const companySchema = require("../schema/companySchema.json");
const companySchemaPatch = require("../schema/companySchemaPatch.json");
const Company = require("../models/company");
const { isEqual } = require("lodash");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

const sqlForPartialUpdate = require("../helpers/partialUpdate");

router.get("/", async (req, res, next) => {
  try {
    const { _token } = req.body;
    const verified = jwt.verify(_token, SECRET_KEY);
    if (verified) {
      const companies = await Company.getAll(req.query);
      return res.json({ companies: companies });
    } else {
      throw new ExpressError(
        "You are not authorized to go here, please login first",
        401
      );
    }
  } catch (error) {
    next(error);
  }
});
router.get("/:handle", async (req, res, next) => {
  try {
    const { _token } = req.body;
    const verified = jwt.verify(_token, SECRET_KEY);
    if (verified) {
      const handle = req.params.handle.toLowerCase();
      const checkIfExist = await Company.getOne(handle);
      if (checkIfExist) {
        return res.json({ company: checkIfExist });
      } else {
        throw new ExpressError("This company does not exist", 404);
      }
    } else {
      throw new ExpressError(
        "You are not authorized to go here, please login first",
        401
      );
    }
  } catch (error) {
    next(error);
  }
});
router.post("/", async (req, res, next) => {
  try {
    const { _token } = req.body;
    const verified = jwt.verify(_token, SECRET_KEY);
    if (verified.is_admin) {
      const result = jsonschema.validate(req.body, companySchema);
      for (let key in result.instance) {
        if (!companySchema.examples[0].hasOwnProperty(key) && key != "_token") {
          throw new ExpressError(
            `${key} is not a valid property for a company`,
            400
          );
        }
      }
      if (result.valid) {
        const newCompany = new Company();
        const companies = await newCompany.create(req.body);
        return res.json({ company: companies });
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
router.patch("/:handle", async (req, res, next) => {
  try {
    const { _token } = req.body;
    const verified = jwt.verify(_token, SECRET_KEY);
    if (verified.is_admin) {
      const result = jsonschema.validate(req.body, companySchemaPatch);
      for (let key in result.instance) {
        if (
          !companySchemaPatch.examples[0].hasOwnProperty(key) &&
          key != "_token"
        ) {
          throw new ExpressError(
            `${key} is not a valid property for a company`,
            400
          );
        }
      }
      if (result.valid) {
        const handle = req.params.handle.toLowerCase();
        const checkIfExist = await Company.getOne(handle);
        if (checkIfExist) {
          if (Object.keys(req.body).length == 0) {
            return res.json({
              msg: "Company unchanged",
              company: checkIfExist,
            });
          }
          let patch = true;
          const checkForNewHandle = await Company.getOne(
            req.body.handle,
            patch
          );
          if (!checkForNewHandle || isEqual(checkForNewHandle, checkIfExist)) {
            if (req.body.handle) {
              req.body.handle = req.body.handle.toLowerCase();
            }
            const company = await sqlForPartialUpdate(
              "companies",
              req.body,
              "handle",
              handle
            );
            company.query.rows[0].jobs = checkIfExist.jobs;
            if (isEqual(company.query.rows[0], checkIfExist)) {
              return res.json({
                msg: "Company unchanged",
                company: checkIfExist,
              });
            }
            return res.json({ updated_company: company.query.rows[0] });
          } else {
            throw new ExpressError(
              `A company has already taken this handle`,
              409
            );
          }
        } else {
          throw new ExpressError("This company does not exist", 404);
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
router.delete("/:handle", async (req, res, next) => {
  try {
    const { _token } = req.body;
    const verified = jwt.verify(_token, SECRET_KEY);
    if (verified.is_admin) {
      const handle = req.params.handle.toLowerCase();
      const checkIfExist = await Company.getOne(handle);
      if (checkIfExist) {
        const deleteCompany = new Company();
        const deletedCompany = await deleteCompany.delete(handle);
        return res.json({
          msg: `The company by the name of ${deletedCompany.name} has been deleted`,
        });
      } else {
        throw new ExpressError("This company does not exist", 404);
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
