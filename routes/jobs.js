const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../helpers/expressError");
const jsonschema = require("jsonschema");
const { isEqual } = require("lodash");
const sqlForPartialUpdate = require("../helpers/partialUpdate");
const Job = require("../models/job");
const jobSchema = require("../schema/jobSchema.json");
const jobSchemaPatch = require("../schema/jobSchemaPatch.json");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const {
  isVerified,
  checkId,
  checkJobExistenceGet,
  checkCompanyExistence,
  noExtraProperties,
} = require("../middleware/jobsMiddleware");
router.get("/", isVerified, async (req, res, next) => {
  try {
    const jobs = await Job.getAll(req.query);
    return res.json({ jobs: jobs });
  } catch (error) {
    next(error);
  }
});
router.get(
  "/:id",
  [isVerified, checkId, checkJobExistenceGet],
  async (req, res, next) => {
    try {
      return res.json({ job: req.initial_job });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/",
  [isVerified, checkCompanyExistence, noExtraProperties],
  async (req, res, next) => {
    try {
      const job = await Job.create(req.body);
      return res.json({ job });
    } catch (error) {
      next(error);
    }
  }
);

router.patch("/:id", async (req, res, next) => {
  try {
    const { _token } = req.body;
    const verified = jwt.verify(_token, SECRET_KEY);
    if (verified.is_admin) {
      const result = jsonschema.validate(req.body, jobSchemaPatch);
      for (let key in result.instance) {
        if (
          !jobSchemaPatch.examples[0].hasOwnProperty(key) &&
          key != "_token"
        ) {
          throw new ExpressError(
            `${key} is not a valid property for a job`,
            400
          );
        }
      }
      if (result.valid) {
        const { id } = req.params;
        if (isNaN(id)) {
          throw new ExpressError("Please make sure job id is an integer", 400);
        }
        const checkIfExist = await Job.getOne(id);
        if (checkIfExist) {
          if (Object.keys(req.body).length == 0) {
            return res.json({ msg: "Job unchanged", job: checkIfExist });
          }
          const job = await sqlForPartialUpdate("jobs", req.body, "id", id);
          if (isEqual(job.query.rows[0], checkIfExist)) {
            return res.json({
              msg: "Job unchanged",
              job: checkIfExist,
            });
          }
          return res.json({ updated_job: job.query.rows[0] });
        } else {
          throw new ExpressError("This job does not exist", 404);
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
router.delete("/:id", async (req, res, next) => {
  try {
    const { _token } = req.body;
    const verified = jwt.verify(_token, SECRET_KEY);
    if (verified.is_admin) {
      const { id } = req.params;
      if (isNaN(id)) {
        throw new ExpressError("Please make sure job id is an integer", 400);
      }
      const checkIfExist = await Job.getOne(id);
      if (checkIfExist) {
        const deleteJob = new Job();
        const deletedJob = await deleteJob.delete(id);
        return res.json({
          msg: `The Job with id ${deletedJob.id} and title ${deletedJob.title} has been deleted`,
        });
      } else {
        throw new ExpressError("This Job does not exist", 404);
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
