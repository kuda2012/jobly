const express = require("express");
const router = new express.Router();
const sqlForPartialUpdate = require("../helpers/partialUpdate");
const User = require("../models/user");
const { isEqual } = require("lodash");
const {
  isVerified,
  checkUsername,
  checkUserExistencePost,
  checkUserExistenceGet,
  noExtraProperties,
} = require("../middleware/usersMiddleware");

router.post("/login", async (req, res, next) => {
  try {
    const loginSuccessful = await User.getLoggedIn(req.body);
    return res.json({ token: loginSuccessful });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  [checkUserExistencePost, noExtraProperties],
  async (req, res, next) => {
    try {
      await User.create(req.body);
      const token = await User.getLoggedIn(req.body);
      return res.json({ token: token });
    } catch (error) {
      next(error);
    }
  }
);

router.get("/", async (req, res, next) => {
  try {
    const users = await User.getAll();
    return res.json({ users });
  } catch (error) {
    next(error);
  }
});
router.get("/:username", checkUserExistenceGet, async (req, res, next) => {
  try {
    return res.json({ user: req.user });
  } catch (error) {
    next(error);
  }
});
router.patch(
  "/:username",
  [
    isVerified,
    checkUserExistenceGet,
    checkUserExistencePost,
    noExtraProperties,
  ],
  async (req, res, next) => {
    try {
      if (Object.keys(req.body).length == 1) {
        return res.json({
          msg: "User unchanged",
          user: req.user,
        });
      }

      // not allowed to change pasword in patch request
      delete req.body["password"];
      const user = await sqlForPartialUpdate(
        "users",
        req.body,
        "username",
        req.user.username
      );
      delete user.query.rows[0]["password"];
      if (isEqual(user.query.rows[0], req.user)) {
        return res.json({
          msg: "User unchanged",
          user: req.user,
        });
      }
      return res.json({ updated_user: user.query.rows[0] });
    } catch (error) {
      next(error);
    }
  }
);
router.delete(
  "/:username",
  [isVerified, checkUserExistenceGet],
  async (req, res, next) => {
    try {
      const deletedUser = await User.delete(req.params.username);
      return res.json({
        msg: `The user with username ${deletedUser.username} has been deleted`,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
