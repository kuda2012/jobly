const app = require("../../app");
const db = require("../../db");
const request = require("supertest");
const Company = require("../../models/company");
const Job = require("../../models/job");

describe("Company Routes Test", function () {
  let u1;
  beforeEach(async function () {
    await db.query("DELETE FROM companies");
    await db.query("DELETE FROM jobs");
    const testCompany = new Company();
    u1 = await testCompany.create({
      handle: "test",
      name: "testing",
      num_employees: 100,
      description: "Description of test company",
      logo_url: "http://www.test.com",
    });
    const companyJobs = await db.query(
      `SELECT * FROM jobs WHERE company_handle=$1`,
      [u1.handle]
    );

    u1.jobs = companyJobs.rows;
  });

  describe("GET /companies should get a list of companies based on a filter or lack thereof", () => {
    test("Should get companies with no filter", async () => {
      let response = await request(app).get("/companies");
      delete u1.jobs;
      expect(response.body.companies[0]).toEqual(u1);
    });
    test("Should get company with name filter", async () => {
      let response = await request(app)
        .get("/companies")
        .query({ handle: "test" });
      delete u1.jobs;
      expect(response.body.companies[0]).toEqual(u1);
    });
    test("Should not get company with bad name filter", async () => {
      // handle cannot be of type integer
      let response = await request(app).get("/companies").query({ handle: 5 });
      expect(response.body.companies).toEqual([]);
    });
    test("Should get company with min_employees filter", async () => {
      let response = await request(app)
        .get("/companies")
        .query({ min_employees: 99 });
      delete u1.jobs;
      expect(response.body.companies[0]).toEqual(u1);
    });
    test("Should not get company with min_employees filter", async () => {
      // min_employees filter is set higher than actual num_employees amount
      let response = await request(app)
        .get("/companies")
        .query({ min_employees: 101 });
      expect(response.body.companies).toEqual([]);
    });
    test("Should get company with max_employees filter", async () => {
      let response = await request(app)
        .get("/companies")
        .query({ max_employees: 101 });
      delete u1.jobs;
      expect(response.body.companies[0]).toEqual(u1);
    });
    test("Should not get company with max_employees filter", async () => {
      // max_employees filter is set lower than actual num_employees amount
      let response = await request(app)
        .get("/companies")
        .query({ max_employees: 99 });
      expect(response.body.companies).toEqual([]);
    });
    test("Should not get company when min_employees is larger than max_employees", async () => {
      let response = await request(app)
        .get("/companies")
        .query({ min_employees: 100, max_employees: 99 });
      expect(response.statusCode).toEqual(400);
    });
  });

  describe("GET /companies/:handle should get a specific company by their handle", () => {
    test("Should get a company if handle is correct", async () => {
      let response = await request(app).get(`/companies/${u1.handle}`);
      expect(response.body.company).toEqual(u1);
    });
    test("Should not get a company if handle is incorrect", async () => {
      let response = await request(app).get(`/companies/lalala`);
      expect(response.statusCode).toEqual(404);
    });
  });

  describe("POST / adding a company ", () => {
    test("Should add a company", async () => {
      let u2 = {
        handle: "test2",
        name: "testing2",
        num_employees: 101,
        description: "Description of test2 company",
        logo_url: "http://www.test2.com",
      };

      let response = await request(app).post("/companies").send(u2);
      expect(response.body.company).toEqual(u2);
    });
    test("Should not add a company if property is not a column in the database", async () => {
      // handle is spelled wrong
      let u2 = {
        haaaaandle: "test2",
        name: "testing2",
        num_employees: 101,
        description: "Description of test2 company",
        logo_url: "http://www.test2.com",
      };
      let response = await request(app).post("/companies").send(u2);
      expect(response.statusCode).toEqual(400);
    });
    test("Should not add a company if json validation fails", async () => {
      // URL is not in correct format
      let u2 = {
        handle: "test2",
        name: "testing2",
        num_employees: 101,
        description: "Description of test2 company",
        logo_url: "www.test2.com",
      };
      let response = await request(app).post("/companies").send(u2);
      expect(response.statusCode).toEqual(400);
    });
    test("Should not add a company if handle or name are missing", async () => {
      // URL is not in correct format
      let u2 = {
        num_employees: 101,
        description: "Description of test2 company",
        logo_url: "www.test2.com",
      };
      let response = await request(app).post("/companies").send(u2);
      expect(response.statusCode).toEqual(400);
    });
  });
  describe("PATCH /companies/:handle editing a company ", () => {
    test("Should edit a company", async () => {
      let oldHandle = u1.handle;
      u1.handle = "tesssst";
      delete u1.jobs;
      let response = await request(app)
        .patch(`/companies/${oldHandle}`)
        .send(u1);
      u1.jobs = [];
      expect(response.body.updated_company).toEqual(u1);
      expect(response.body.updated_company.handle).not.toEqual(oldHandle);
    });
    test("Should remain unchanged if no edits are sent", async () => {
      delete u1.jobs;
      let response = await request(app)
        .patch(`/companies/${u1.handle}`)
        .send(u1);
      u1.jobs = [];
      expect(response.body.company).toEqual(u1);
      expect(response.body.msg).toEqual("Company unchanged");
    });
    test("Should not patch a company if handle is incorrect", async () => {
      delete u1.jobs;
      let response = await request(app).patch(`/companies/lalala`).send(u1);
      expect(response.statusCode).toEqual(404);
    });
  });

  describe("DELETE /companies/:handle deleting a company ", () => {
    test("Should delete a company", async () => {
      let response = await request(app).delete(`/companies/${u1.handle}`);
      expect(response.body.msg).toEqual(
        `The company by the name of ${u1.name} has been deleted`
      );
      let getDeleted = await request(app).get(`/companies/${u1.handle}`);
      expect(getDeleted.statusCode).toEqual(404);
    });
  });
  afterEach(async () => {
    await db.query("DELETE FROM companies");
  });
});
afterAll(async () => {
  await db.end();
});
