const app = require("../../app");
const db = require("../../db");
const request = require("supertest");
const user = require("../../models/user");

describe("user Routes Test", function () {
  let u1;
  beforeEach(async function () {
    await db.query("DELETE FROM users");
    const testuser = new user();
    u1 = await testuser.create({
      username: "testUser",
      password: "password",
      first_name: "Tester",
      last_name: "McTestFace",
      email: "test@gmail.com",
      photo_url: "http://testpic.com",
      is_admin: false,
    });
  });

  describe("GET /users should get a list of users", () => {
    test("Should get a list of users ", async () => {
      let response = await request(app).get("/users");
      expect(response.body.users[0]).toEqual(u1);
    });
  });

  describe("GET /users/:username should get a specific user by its username", () => {
    test("Should get a company if username is correct", async () => {
      let response = await request(app).get(`/users/${u1.username}`);
      expect(response.body.user).toEqual(u1);
    });
    test("Should not get a user if username is incorrect", async () => {
      let response = await request(app).get(`/users/kakakakaka`);
      expect(response.statusCode).toEqual(404);
    });
  });

  describe("POST / adding a user ", () => {
    test("Should add a user", async () => {
      let u2 = {
        username: "testuser2",
        password: "password",
        first_name: "Tester",
        last_name: "McTestFace2",
        email: "test2@gmail.com",
        photo_url: "http://testpic.com",
        is_admin: true,
      };
      let response = await request(app).post("/users").send(u2);
      expect(response.body.user).toEqual(u2);
    });
    test("Should not add a user because a property is missing", async () => {
      // password property is spelled wrong
      let u2 = {
        usernameeeeeeeeee: "testuser2",
        first_name: "Tester",
        last_name: "McTestFace2",
        email: "test2@gmail.com",
        photo_url: "http://testpic.com",
        is_admin: true,
      };
      let response = await request(app).post("/users").send(u2);
      expect(response.statusCode).toEqual(400);
    });
    test("Should not add a user because property is spelled wrong", async () => {
      // username property is spelled wrong
      let u2 = {
        usernameeeeeeeeee: "testuser2",
        password: "password",
        first_name: "Tester",
        last_name: "McTestFace2",
        email: "test2@gmail.com",
        photo_url: "http://testpic.com",
        is_admin: true,
      };
      let response = await request(app).post("/users").send(u2);
      expect(response.statusCode).toEqual(400);
    });
    test("Should not add a user because username or email are taken", async () => {
      let u2 = {
        username: "testuser",
        password: "password",
        first_name: "Tester",
        last_name: "McTestFace2",
        email: "test@gmail.com",
        photo_url: "http://testpic.com",
        is_admin: true,
      };
      let response = await request(app).post("/users").send(u2);
      expect(response.statusCode).toEqual(409);
      expect(response.body.message).toEqual(
        `Both username and email are not available`
      );
    });
  });
  describe("PATCH /users/:username editing a user ", () => {
    test("Should edit a user", async () => {
      let oldUsername = u1.username;
      u1.username = "testusertestuser";
      let response = await request(app).patch(`/users/${oldUsername}`).send(u1);
      expect(response.body.updated_user).toEqual(u1);
      expect(response.body.updated_user.username).not.toEqual(oldUsername);
    });
    test("Should remain unchanged if no edits are sent", async () => {
      let response = await request(app).patch(`/users/${u1.username}`).send(u1);
      expect(response.body.user).toEqual(u1);
      expect(response.body.msg).toEqual("User unchanged");
    });
    test("Should not patch a user if username is incorrect", async () => {
      let response = await request(app).patch(`/users/kasdfks`).send({});
      expect(response.statusCode).toEqual(404);
    });
  });

  describe("DELETE /users/:username deleting a user ", () => {
    test("Should delete a user", async () => {
      let response = await request(app).delete(`/users/${u1.username}`);
      expect(response.body.msg).toEqual(
        `The user with username ${u1.username} has been deleted`
      );
      let getDeleted = await request(app).get(`/users/${u1.username}`);
      expect(getDeleted.statusCode).toEqual(404);
    });
  });
  afterEach(async () => {
    await db.query("DELETE FROM users");
  });
});
afterAll(async () => {
  await db.query("DELETE FROM companies");
  await db.end();
});
