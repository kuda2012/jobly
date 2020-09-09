const app = require("../../app");
const db = require("../../db");
const request = require("supertest");
const Company = require("../../models/company");

describe("Auth Routes Test", function () {
  beforeEach(async function () {
    await db.query("DELETE FROM companies");
    const newCompany = new Company();
    let u1 = await Company.create({
      handle: "test",
      name: "testing",
      num_employees: 1,
      description: "Description of test company",
      logo_url: "www.test.com",
    });
  });
});
