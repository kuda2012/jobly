const db = require("../db");
const ExpressError = require("../helpers/expressError");
class Company {
  static async getAll(column) {
    const handleTerm = "%" + column.handle + "%";
    if (Number(column.min_employees) > Number(column.max_employees)) {
      throw new ExpressError(
        "Min Value cannnot be greated than Max Value",
        400
      );
    }
    let companies;
    if (column.handle && column.min_employees && column.max_employees) {
      companies = await db.query(
        `SELECT * FROM companies WHERE (handle ILIKE $1 OR name ILIKE $1) AND num_employees BETWEEN $2 AND $3`,
        [handleTerm, column.min_employees, column.max_employees]
      );
    } else if (
      column.handle &&
      !column.min_employees &&
      !column.max_employees
    ) {
      companies = await db.query(
        `SELECT * FROM companies WHERE (handle ILIKE $1 OR name ILIKE $1)`,
        [handleTerm]
      );
    } else if (
      column.min_employees &&
      !column.handle &&
      !column.max_employees
    ) {
      companies = await db.query(
        `SELECT * FROM companies WHERE num_employees >= $1`,
        [column.min_employees]
      );
    } else if (
      column.max_employees &&
      !column.handle &&
      !column.min_employees
    ) {
      companies = await db.query(
        `SELECT * FROM companies WHERE num_employees <= $1`,
        [column.max_employees]
      );
    } else if (column.handle && column.min_employees && !column.max_employees) {
      companies = await db.query(
        `SELECT * FROM companies WHERE (handle ILIKE $1 OR name ILIKE $1) AND num_employees >= $2`,
        [handleTerm, column.min_employees]
      );
    } else if (column.handle && column.max_employees && !column.min_employees) {
      companies = await db.query(
        `SELECT * FROM companies WHERE (handle ILIKE $1 OR name ILIKE $1) AND num_employees <= $2`,
        [handleTerm, column.max_employees]
      );
    } else if (column.min_employees && column.max_employees && !column.handle) {
      companies = await db.query(
        `SELECT * FROM companies WHERE num_employees BETWEEN $1 AND $2 `,
        [column.min_employees, column.max_employees]
      );
    } else {
      companies = await db.query(`SELECT * FROM companies `);
    }
    return companies.rows;
  }
  static async getOne(handle) {
    const getCompany = await db.query(
      `SELECT * FROM companies WHERE handle = $1`,
      [handle]
    );
    if (getCompany.rows.length == 0) {
      throw new ExpressError("This company does not exist", 404);
    }
    const getCompanyJobs = await db.query(
      `SELECT * FROM jobs WHERE company_handle = $1`,
      [handle]
    );
    getCompany.rows[0].jobs = getCompanyJobs.rows;
    return getCompany.rows[0];
  }
  async create(body) {
    const { handle, name, num_employees, description, logo_url } = body;
    const getCompany = await db.query(
      `SELECT * FROM companies WHERE handle = $1`,
      [handle]
    );
    if (getCompany.rows.length == 0) {
      const newCompany = await db.query(
        `INSERT INTO companies (handle, name, num_employees, description, logo_url)
                                         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [handle, name, num_employees, description, logo_url]
      );
      return newCompany.rows[0];
    } else {
      throw new ExpressError("This company already exist", 409)
    }
  }
  async delete(handle) {
    const deleteCompany = await db.query(
      `DELETE FROM companies WHERE handle = $1 RETURNING name`,
      [handle]
    );
    return deleteCompany.rows[0];
  }
}

module.exports = Company;
