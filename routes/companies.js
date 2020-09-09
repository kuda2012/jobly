const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../helpers/expressError");
const { SECRET_KEY } = require("../config");
const Company = require("../models/company");

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
    const newCompany = new Company();
    const companies = await newCompany.create(req.body);
    return res.json({ company: companies });
  } catch (error) {
    next(error);
  }
});
router.patch("/:handle", async (req, res, next) => {
  try {
    const { handle } = req.params;
    const checkIfExist = await Company.getOne(handle);
    if (checkIfExist) {
      if (req.body.handle == checkIfExist.handle) {
        delete req.body.handle;
      } else if (req.body.name == checkIfExist.name) {
        delete req.body.name;
      }
      const company = await sqlForPartialUpdate(
        "companies",
        req.body,
        "handle",
        handle
      );
      return res.json({ updated_company: company.query.rows[0] });
    } else {
      throw new ExpressError("This company does not exist", 404);
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
        message: `The company by the name of ${deletedCompany.name} has been deleted`,
      });
    } else {
      throw new ExpressError("This company does not exist", 404);
    }
  } catch (error) {
    next(error);
  }
});
module.exports = router;
