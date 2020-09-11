const db = require("../db");
const ExpressError = require("../helpers/expressError");

class User {
  static async getAll() {
    const users = await db.query(`SELECT * FROM users`);
    return users.rows;
  }
  async create(body) {
    const {
      username,
      password,
      first_name,
      last_name,
      email,
      photo_url,
      is_admin,
    } = body;
    const newUser = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, email, photo_url, is_admin)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [username, password, first_name, last_name, email, photo_url, is_admin]
    );
    return newUser.rows[0];
  }
  static async getUser(username) {
    const getUser = await db.query(`SELECT * FROM users WHERE username = $1`, [
      username,
    ]);
    return getUser.rows[0];
  }
  static async getEmail(email) {
    const getEmail = await db.query(`SELECT * FROM users WHERE email = $1`, [
      email,
    ]);
    return getEmail.rows[0];
  }
}

module.exports = User;
