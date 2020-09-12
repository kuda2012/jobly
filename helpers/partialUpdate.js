/**
 * Generate a selective update query based on a request body:
 *
 * - table: where to make the query
 * - items: an object with keys of columns you want to update and values with
 *          updated values
 * - key: the column that we query by (e.g. username, handle, id)
 * - id: current record ID
 *
 * Returns object containing a DB query as a string, and array of
 * string values to be updated
 *
 */

const db = require("../db");
const expressError = require("./expressError");
const ExpressError = require("./expressError");
async function sqlForPartialUpdate(table, items, key, id) {
  try {
    // keep track of item indexes
    // store all the columns we want to update and associate with vals
    let idx = 1;
    let columns = [];

    // filter out keys that start with "_" -- we don't want these in DB
    for (let key in items) {
      if (key.startsWith("_")) {
        delete items[key];
      }
    }

    for (let column in items) {
      columns.push(`${column}=$${idx}`);
      idx += 1;
    }

    // build query
    let values = Object.values(items);
    values.push(id);
    let cols = columns.join(", ");
    let query = await db.query(
      `UPDATE ${table} SET ${cols} WHERE ${key}=$${idx} RETURNING *`,
      [...values]
    );

    return { query, values };
  } catch (error) {
    throw new ExpressError();
  }
}

// sqlForPartialUpdate(
//   "companies",
//   { handle: "kro", name: "kroger", num_employees: 2923098 },
//   "handle",
//   "fl"
// );

module.exports = sqlForPartialUpdate;
