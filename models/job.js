const db = require("../db");
const ExpressError = require("../helpers/expressError");

class Job {
  static async getAll(column) {
    const jobTitle = "%" + column.title + "%";
    let jobs;
    if (column.title && column.min_salary && column.min_equity) {
      jobs = await db.query(
        `SELECT * FROM jobs WHERE title ILIKE $1 AND salary >= $2 AND equity >= $3`,
        [jobTitle, column.min_salary, column.min_equity]
      );
    } else if (column.title && !column.min_salary && !column.min_equity) {
      jobs = await db.query(`SELECT * FROM jobs WHERE title ILIKE $1`, [
        jobTitle,
      ]);
    } else if (column.min_salary && !column.title && !column.min_equity) {
      jobs = await db.query(`SELECT * FROM jobs WHERE salary >= $1`, [
        column.min_salary,
      ]);
    } else if (column.min_equity && !column.title && !column.min_salary) {
      jobs = await db.query(`SELECT * FROM jobs WHERE equity >= $1`, [
        column.min_equity,
      ]);
    } else if (column.title && column.min_salary && !column.min_equity) {
      jobs = await db.query(
        `SELECT * FROM jobs WHERE title ILIKE $1 AND salary >= $2`,
        [jobTitle, column.min_salary]
      );
    } else if (column.title && column.min_equity && !column.min_salary) {
      jobs = await db.query(
        `SELECT * FROM jobs WHERE title ILIKE $1 AND equity >= $2`,
        [jobTitle, column.min_equity]
      );
    } else if (column.min_salary && column.min_equity && !column.title) {
      jobs = await db.query(
        `SELECT * FROM jobs WHERE salary >= $1 AND equity >= $2 `,
        [column.min_salary, column.min_equity]
      );
    } else {
      jobs = await db.query(`SELECT * FROM jobs `);
    }
    return jobs.rows;
  }
  static async getOne(id) {
    const getJob = await db.query(`SELECT * FROM jobs WHERE id = $1`, [id]);
    return getJob.rows[0];
  }
  async create(body) {
    const { title, salary, equity, company_handle } = body;
    const newJob = await db.query(
      `INSERT INTO jobs (title, salary, equity, company_handle)
                                         VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, salary, equity, company_handle]
    );
    return newJob.rows[0];
  }
  async delete(id) {
    const deleteJob = await db.query(
      `DELETE FROM jobs WHERE id = $1 RETURNING id, title`,
      [id]
    );
    return deleteJob.rows[0];
  }
}

module.exports = Job;
