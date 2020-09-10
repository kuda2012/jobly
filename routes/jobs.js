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

router.get("/", async (req, res, next) => {
  try {
    const jobs = await Job.getAll(req.query);
    return res.json({ jobs: jobs });
  } catch (error) {
    next(error);
  }
});
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const checkIfExist = await Job.getOne(id);
    if (checkIfExist) {
      return res.json({ job: checkIfExist });
    } else {
      throw new ExpressError("This job does not exist", 404);
    }
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const result = jsonschema.validate(req.body, jobSchema);
    if (result.valid) {
      for (let key in result.instance) {
        if (!jobSchema.examples[0].hasOwnProperty(key)) {
          throw new ExpressError(
            `${key} is not a valid property for a job`,
            400
          );
        }
      }
      const newJob = new Job();
      const job = await newJob.create(req.body);
      return res.json({ job });
    } else {
      const listOfErrors = result.errors.map((error) => error.stack);
      const err = new ExpressError(listOfErrors, 400);
      return next(err);
    }
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const result = jsonschema.validate(req.body, jobSchemaPatch);
    if (result.valid) {
      for (let key in result.instance) {
        if (!jobSchemaPatch.examples[0].hasOwnProperty(key)) {
          throw new ExpressError(
            `${key} is not a valid property for a job`,
            400
          );
        }
      }
      const { id } = req.params;
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
  } catch (error) {
    next(error);
  }
});
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
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
  } catch (error) {
    next(error);
  }
});
module.exports = router;
