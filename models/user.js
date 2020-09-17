const db = require("../db");
const ExpressError = require("../helpers/expressError");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { BCRYPT_HASH_ROUNDS } = require("../config");
const { SECRET_KEY } = require("../config");
class User {
  static async getAll() {
    const users = await db.query(
      `SELECT username, first_name, last_name, email, photo_url, is_admin FROM users`
    );
    return users.rows;
  }

  static async getLoggedIn(body) {
    const { username, password } = body;
    if (!username || !password) {
      throw new ExpressError("Must enter a username and password", 400);
    }

    const getPassword = await db.query(
      `SELECT password from users WHERE username =$1`,
      [username.toLowerCase()]
    );
    if (getPassword.rows[0]) {
      const passwordCorrect = await bcrypt.compare(
        password,
        getPassword.rows[0].password
      );
      if (passwordCorrect) {
        const result = await this.getUser(username);
        const token = jwt.sign(result, SECRET_KEY);
        return token;
      }
    } else {
      throw new ExpressError("User does not exist", 404);
    }
  }

  static async create(body) {
    const {
      username,
      password,
      first_name,
      last_name,
      email,
      photo_url,
      is_admin,
    } = body;
    const hashedPassword = await bcrypt.hash(password, BCRYPT_HASH_ROUNDS);
    const newUser = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, email, photo_url, is_admin)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING username, is_admin`,
      [
        username.toLowerCase(),
        hashedPassword,
        first_name,
        last_name,
        email,
        photo_url,
        is_admin,
      ]
    );
    return newUser.rows[0];
  }
  static async getUser(username) {
    const getUser = await db.query(
      `SELECT username, is_admin FROM users WHERE username = $1`,
      [username.toLowerCase()]
    );
    return getUser.rows[0];
  }
  static async getEmail(email) {
    const getEmail = await db.query(
      `SELECT username, is_admin FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );
    return getEmail.rows[0];
  }
  static async getUserAllColumns(username) {
    const getUser = await db.query(`SELECT * FROM users WHERE username = $1`, [
      username.toLowerCase(),
    ]);
    return getUser.rows[0];
  }
  static async delete(username) {
    const deleteUser = await db.query(
      `DELETE FROM users WHERE username = $1 RETURNING username`,
      [username.toLowerCase()]
    );
    return deleteUser.rows[0];
  }
  static async login(body) {}
}

module.exports = User;
