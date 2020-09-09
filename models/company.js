const db = require("../db");
const ExpressError = require("../helpers/expressError");
class Company {
  static async getAll(column) {
    const searchTerm = "%" + column.search + "%";
    if (column.min_employees > column.max_employees) {
      throw new ExpressError(
        "Min Value cannnot be greated than Max Value",
        400
      );
    }
    let companies;
    if (column.search && column.min_employees && column.max_employees) {
      companies = await db.query(
        `SELECT * FROM companies WHERE (name ILIKE $1 OR handle ILIKE $1) AND num_employees BETWEEN $2 AND $3`,
        [searchTerm, column.min_employees, column.max_employees]
      );
    } else if (
      column.search &&
      !column.min_employees &&
      !column.max_employees
    ) {
      companies = await db.query(
        `SELECT * FROM companies WHERE name ILIKE $1 OR handle ILIKE $1`,
        [searchTerm]
      );
    } else if (
      column.min_employees &&
      !column.search &&
      !column.max_employees
    ) {
      companies = await db.query(
        `SELECT * FROM companies WHERE num_employees >= $1`,
        [column.min_employees]
      );
    } else if (
      column.max_employees &&
      !column.search &&
      !column.min_employees
    ) {
      companies = await db.query(
        `SELECT * FROM companies WHERE num_employees <= $1`,
        [column.max_employees]
      );
    } else if (column.search && column.min_employees && !column.max_employees) {
      companies = await db.query(
        `SELECT * FROM companies WHERE (name ILIKE $1 OR handle ILIKE $1) AND num_employees >= $2`,
        [searchTerm, column.min_employees]
      );
    } else if (column.search && column.max_employees && !column.min_employees) {
      companies = await db.query(
        `SELECT * FROM companies WHERE (name ILIKE $1 OR handle ILIKE $1) AND num_employees <= $2`,
        [searchTerm, column.max_employees]
      );
    } else if (column.min_employees && column.max_employees && !column.search) {
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
      `SELECT * FROM COMPANIES WHERE handle = $1`,
      [handle]
    );
    return getCompany.rows[0];
  }
  async create(body) {
    const { handle, name, num_employees, description, logo_url } = body;
    if (!handle || !name) {
      throw new ExpressError(
        "Must enter a handle and a name to create a company",
        400
      );
    }
    const CheckIfAlreadyExist = await db.query(
      `SELECT * FROM companies WHERE name =$1 OR handle =$2`,
      [name, handle]
    );
    if (CheckIfAlreadyExist.rows.length > 0) {
      throw new ExpressError("This company already exists", 409);
    }
    const newCompany = await db.query(
      `INSERT INTO companies (handle, name, num_employees, description, logo_url)
                                         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [handle, name, num_employees, description, logo_url]
    );
    return newCompany.rows[0];
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
