const express = require("express");
const router = new express.Router();
const { isEqual } = require("lodash");
const sqlForPartialUpdate = require("../helpers/partialUpdate");
const Job = require("../models/job");
const {
  isVerified,
  checkId,
  checkJobExistence,
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
  [isVerified, checkId, checkJobExistence],
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

router.patch(
  "/:id",
  [
    isVerified,
    checkId,
    checkCompanyExistence,
    checkJobExistence,
    noExtraProperties,
  ],
  async (req, res, next) => {
    try {
      if (Object.keys(req.body).length == 1) {
        return res.json({ msg: "Job unchanged", job: req.initial_job });
      }
      const id = req.params.id;
      const job = await sqlForPartialUpdate("jobs", req.body, "id", id);
      if (isEqual(job.query.rows[0], req.initial_job)) {
        return res.json({
          msg: "Job unchanged",
          job: req.initial_job,
        });
      }
      return res.json({ updated_job: job.query.rows[0] });
    } catch (error) {
      next(error);
    }
  }
);
router.delete(
  "/:id",
  [isVerified, checkId, checkJobExistence],
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const deletedJob = await Job.delete(id);
      return res.json({
        msg: `The Job with id ${deletedJob.id} and title ${deletedJob.title} has been deleted`,
      });
    } catch (error) {
      next(error);
    }
  }
);
module.exports = router;
