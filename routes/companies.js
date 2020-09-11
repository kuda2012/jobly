const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../helpers/expressError");
const jsonschema = require("jsonschema");
const companySchema = require("../schema/companySchema.json");
const companySchemaPatch = require("../schema/companySchemaPatch.json");
const Company = require("../models/company");
const { isEqual } = require("lodash");

const sqlForPartialUpdate = require("../helpers/partialUpdate");

router.get("/", async (req, res, next) => {
  try {
    const companies = await Company.getAll(req.query);
    return res.json({ companies: companies });
  } catch (error) {
    next(error);
  }
});
router.get("/:handle", async (req, res, next) => {
  try {
    const { handle } = req.params;
    const checkIfExist = await Company.getOne(handle);
    if (checkIfExist) {
      return res.json({ company: checkIfExist });
    } else {
      throw new ExpressError("This company does not exist", 404);
    }
  } catch (error) {
    next(error);
  }
});
router.post("/", async (req, res, next) => {
  try {
    const result = jsonschema.validate(req.body, companySchema);
    for (let key in result.instance) {
      if (!companySchema.examples[0].hasOwnProperty(key)) {
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
  } catch (error) {
    next(error);
  }
});
router.patch("/:handle", async (req, res, next) => {
  try {
    const result = jsonschema.validate(req.body, companySchemaPatch);
    for (let key in result.instance) {
      if (!companySchemaPatch.examples[0].hasOwnProperty(key)) {
        throw new ExpressError(
          `${key} is not a valid property for a company`,
          400
        );
      }
    }
    if (result.valid) {
      const { handle } = req.params;
      const checkIfExist = await Company.getOne(handle);
      if (checkIfExist) {
        if (Object.keys(req.body).length == 0) {
          return res.json({ msg: "Company unchanged", company: checkIfExist });
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
        throw new ExpressError("This company does not exist", 404);
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
router.delete("/:handle", async (req, res, next) => {
  try {
    const { handle } = req.params;
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
  } catch (error) {
    next(error);
  }
});
module.exports = router;
