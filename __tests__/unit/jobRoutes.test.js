const app = require("../../app");
const db = require("../../db");
const request = require("supertest");
const Company = require("../../models/company");
const Job = require("../../models/job");

describe("Job Routes Test", function () {
  let u1;
  beforeAll(async function () {
    await db.query("DELETE FROM companies");
    const testCompany = new Company();
    company1 = await testCompany.create({
      handle: "test",
      name: "testing",
      salary: 100,
      description: "Description of test company",
      logo_url: "http://www.test.com",
    });
  });
  beforeEach(async function () {
    await db.query("DELETE FROM jobs");
    const testJob = new Job();
    u1 = await testJob.create({
      title: "testJob",
      salary: 10000,
      equity: 0.5,
      company_handle: "test",
    });
  });

  describe("GET /jobs should get a list of jobs based on a filter or lack thereof", () => {
    test("Should get jobs with no filter", async () => {
      let response = await request(app).get("/jobs");
      u1.date_posted = response.body.jobs[0].date_posted;

      expect(response.body.jobs[0]).toEqual(u1);
    });
    test("Should get job with title filter", async () => {
      let response = await request(app)
        .get("/jobs")
        .query({ title: "testJob" });
      u1.date_posted = response.body.jobs[0].date_posted;
      expect(response.body.jobs[0]).toEqual(u1);
    });
    test("Should not get job with bad title filter", async () => {
      // title cannot be of type integer
      let response = await request(app).get("/jobs").query({ title: 5 });
      expect(response.body.jobs).toEqual([]);
    });
    test("Should get job with min_salary filter", async () => {
      let response = await request(app)
        .get("/jobs")
        .query({ min_salary: 9999 });
      u1.date_posted = response.body.jobs[0].date_posted;
      expect(response.body.jobs[0]).toEqual(u1);
    });
    test("Should not get job with min_salary filter", async () => {
      // min_salary filter is set higher than actual salary amount
      let response = await request(app)
        .get("/jobs")
        .query({ min_salary: 10001 });
      expect(response.body.jobs).toEqual([]);
    });
    test("Should get job with min_equity filter", async () => {
      let response = await request(app).get("/jobs").query({ min_equity: 0.3 });
      u1.date_posted = response.body.jobs[0].date_posted;
      expect(response.body.jobs[0]).toEqual(u1);
    });
    test("Should not get job with min_equity filter", async () => {
      // min_equity filter is set lower than actual salary amount
      let response = await request(app).get("/jobs").query({ min_equity: 1 });
      expect(response.body.jobs).toEqual([]);
    });
    test("Should not get job when min_equity is larger than 1", async () => {
      let response = await request(app).get("/jobs").query({ min_equity: 1.1 });
      expect(response.statusCode).toBe(400);
    });
  });

  describe("GET /jobs/:id should get a specific job by its id", () => {
    test("Should get a company if id is correct", async () => {
      let response = await request(app).get(`/jobs/${u1.id}`);
      u1.date_posted = response.body.job.date_posted;
      expect(response.body.job).toEqual(u1);
    });
    test("Should not get a job if id is incorrect", async () => {
      let response = await request(app).get(`/jobs/9`);
      expect(response.statusCode).toEqual(404);
    });
    test("Should not get a job if id is not an integer", async () => {
      let response = await request(app).get(`/jobs/lalala`);
      expect(response.statusCode).toEqual(400);
    });
  });

  describe("POST / adding a job ", () => {
    test("Should add a job", async () => {
      let u2 = {
        title: "testJob2",
        salary: 5000,
        equity: 0.2,
        company_handle: "test",
      };
      let response = await request(app).post("/jobs").send(u2);
      u2.date_posted = response.body.job.date_posted;
      u2.id = response.body.job.id;
      expect(response.body.job).toEqual(u2);
    });
    test("Should not add a job because property is spelled wrong", async () => {
      // title property is spelled wrong
      let u2 = {
        tiiiiitle: "testJob2",
        salary: 5000,
        equity: 0.2,
        company_handle: "test",
      };
      let response = await request(app).post("/jobs").send(u2);
      expect(response.statusCode).toEqual(400);
    });
    test("Should not add a job because a entered value is out of range", async () => {
      // equity must be between 1 and 0 inclusive
      let u2 = {
        title: "testJob2",
        salary: 5000,
        equity: 1.3,
        company_handle: "test",
      };
      let response = await request(app).post("/jobs").send(u2);
      expect(response.statusCode).toEqual(400);
    });
    test("Should not add a job because object is missing required field", async () => {
      // title is a required field
      let u2 = {
        salary: 5000,
        equity: 1.3,
        company_handle: "test",
      };
      let response = await request(app).post("/jobs").send(u2);
      expect(response.statusCode).toEqual(400);
    });
  });
  describe("PATCH /jobs/:id editing a job ", () => {
    test("Should edit a job", async () => {
      let oldTitle = u1.title;
      u1.title = "tEsTjOb";
      const holdId = u1.id;
      const holdDatePosted = u1.date_posted;
      delete u1.id;
      delete u1.date_posted;
      let response = await request(app).patch(`/jobs/${holdId}`).send(u1);
      u1.id = holdId;
      u1.date_posted = response.body.updated_job.date_posted;
      expect(response.body.updated_job).toEqual(u1);
      expect(response.body.updated_job.title).not.toEqual(oldTitle);
    });
    test("Should remain unchanged if no edits are sent", async () => {
      const holdId = u1.id;
      const holdDatePosted = u1.date_posted;
      delete u1.id;
      delete u1.date_posted;
      let response = await request(app).patch(`/jobs/${holdId}`).send(u1);
      u1.id = holdId;
      u1.date_posted = response.body.job.date_posted;
      expect(response.body.job).toEqual(u1);
      expect(response.body.msg).toEqual("Job unchanged");
    });
    test("Should not patch a job if id is incorrect", async () => {
      let response = await request(app).patch(`/jobs/934820`).send({});
      expect(response.statusCode).toEqual(404);
    });
    test("Should not patch a job if id not an integer", async () => {
      let response = await request(app).patch(`/jobs/lala`).send({});
      expect(response.statusCode).toEqual(400);
    });
  });

  describe("DELETE /jobs/:id deleting a job ", () => {
    test("Should delete a job", async () => {
      let response = await request(app).delete(`/jobs/${u1.id}`);
      expect(response.body.msg).toEqual(
        `The Job with id ${u1.id} and title ${u1.title} has been deleted`
      );
      let getDeleted = await request(app).get(`/jobs/${u1.id}`);
      expect(getDeleted.statusCode).toEqual(404);
    });
  });
  afterEach(async () => {
    await db.query("DELETE FROM jobs");
  });
});
afterAll(async () => {
  await db.query("DELETE FROM companies");
  await db.end();
});
