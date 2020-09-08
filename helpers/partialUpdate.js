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

async function sqlForPartialUpdate(table, items, key, id) {
  // keep track of item indexes
  // store all the columns we want to update and associate with vals
  debugger;
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
  let cols = columns.join(", ");
  let query = await db.query(
    `UPDATE ${table} SET ${cols} WHERE ${key}=$${idx} RETURNING *`,
    [items[key], id]
  );

  let values = Object.values(items);
  values.push(id);

  return { query, values };
}

sqlForPartialUpdate(
  "companies",
  {
    name: "footlocker",
  },
  "name",
  "kroger"
);

// async function sqlForPartialUpdate(table, items, key, id) {
//   // keep track of item indexes
//   // store all the columns we want to update and associate with vals
//   debugger;
//   let idx = 1;
//   let columns = [];

//   // filter out keys that start with "_" -- we don't want these in DB
//   for (let key in items) {
//     if (key.startsWith("_")) {
//       delete items[key];
//     }
//   }

//   for (let column in items) {
//     columns.push(`${column}=$${idx}`);
//     idx += 1;
//   }

//   // build query
//   let values = Object.values(items);
//   values.push(id);
//   console.log([...values]);
//   let cols = columns.join(", ");
//   let query = await db.query(
//     `UPDATE ${table} SET ${cols} WHERE ${key}=$${idx} RETURNING *`,
//     [...values]
//   );

//   return { query, values };
// }

// sqlForPartialUpdate(
//   "companies",
//   { handle: "kro", name: "kroger", num_employees: 2923098 },
//   "name",
//   "Walmart"
// );

module.exports = sqlForPartialUpdate;
