const db = require("../../db");
const sqlForPartialUpdate = require("../../helpers/partialUpdate");

describe("partialUpdate()", () => {
  let company;
  beforeEach(async () => {
    await db.query(`DELETE FROM companies`);
    company = await db.query(`
INSERT INTO companies (handle, name, num_employees, description, logo_url)
VALUES ('kro', 'kroger',3232982,'Cheap groceries', 'kroger.com') RETURNING *
`);
  });
  it("can update multiple columns of an entry at once", async function () {
    expect(company.rows[0].name).toBe("kroger");
    expect(company.rows[0].handle).toBe("kro");
    let changes = { handle: "fl", name: "footlocker" };
    company = await sqlForPartialUpdate("companies", changes, "name", "kroger");
    expect(company.query.rows[0].name).toBe("footlocker");
    expect(company.query.rows[0].handle).toBe("fl");
  });
  it("can update just one column", async function () {
    expect(company.rows[0].name).toBe("kroger");
    let changes = { name: "KROGER" };
    company = await sqlForPartialUpdate("companies", changes, "name", "kroger");
    expect(company.query.rows[0].name).toBe("KROGER");
  });

  afterEach(async () => {
    await db.query(`DELETE FROM companies`);
  });
});

afterAll(async () => {
  await db.end();
});
