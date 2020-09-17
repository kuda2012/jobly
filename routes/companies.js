const express = require("express");
const router = new express.Router();
const ExpressError = require("../helpers/expressError");
const Company = require("../models/company");
const { isEqual } = require("lodash");
const {
  isVerified,
  checkCompanyExistenceGet,
  checkCompanyExistencePost,
  noExtraProperties,
} = require("../middleware/companyMiddleware");

const sqlForPartialUpdate = require("../helpers/partialUpdate");

router.get("/", isVerified, async (req, res, next) => {
  try {
    const companies = await Company.getAll(req.query);
    return res.json({ companies: companies });
  } catch (error) {
    next(error);
  }
});
router.get(
  "/:handle",
  [isVerified, checkCompanyExistenceGet],
  async (req, res, next) => {
    try {
      return res.json({ company: req.initial_company });
    } catch (error) {
      next(error);
    }
  }
);
router.post(
  "/",
  [isVerified, checkCompanyExistencePost, noExtraProperties],
  async (req, res, next) => {
    try {
      const companies = await Company.create(req.body);
      return res.json({ company: companies });
    } catch (error) {
      next(error);
    }
  }
);
router.patch(
  "/:handle",
  [
    isVerified,
    checkCompanyExistenceGet,
    checkCompanyExistencePost,
    noExtraProperties,
  ],
  async (req, res, next) => {
    try {
      let handle = req.params.handle;
      if (isEqual(req.initial_company, req.other_company)) {
        if (req.body.handle) {
          req.body.handle = req.body.handle.toLowerCase();
        }
        const changedCompany = await sqlForPartialUpdate(
          "companies",
          req.body,
          "handle",
          handle
        );
        changedCompany.query.rows[0].jobs = req.initial_company.jobs;
        if (isEqual(changedCompany.query.rows[0], req.initial_company)) {
          return res.json({
            msg: "Company unchanged",
            company: req.initial_company,
          });
        }
        return res.json({ updated_company: changedCompany.query.rows[0] });
      } else {
        throw new ExpressError(`A company has already taken this handle`, 409);
      }
    } catch (error) {
      next(error);
    }
  }
);
router.delete(
  "/:handle",
  [isVerified, checkCompanyExistenceGet],
  async (req, res, next) => {
    try {
      let handle = req.params.handle;
      const deletedCompany = await Company.delete(handle);
      return res.json({
        msg: `The company by the name of ${deletedCompany.name} has been deleted`,
      });
    } catch (error) {
      next(error);
    }
  }
);
module.exports = router;
