const AsyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel.js");
const User = require("../models/userModel.js");
const Doctor = require("../models/doctorModel.js");
const dotenv = require("dotenv");

dotenv.config();

const adminProtect = AsyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      console.log("in admin protect");
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      console.log(decoded);

      await Admin.findById(decoded.id);

      next();
    } catch (error) {
      console.log("failed token");
      res.status(401);
      throw new Error("Not authorized, token fail");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not Autherized");
  }
});

const userProtect = AsyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      console.log("in try userprotect");
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      console.log(decoded);

      const user = await User.findById(decoded.id);
      console.log(user);
      if(user.isBlocked){
        localStorage.removeItem('user')
      }

      next();
    } catch (error) {
      console.log("failed token");
      res.status(401);
      throw new Error("Not authorized, token fail");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not Autherized");
  }
});

const doctorProtect = AsyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      console.log("in doctor protect");
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      console.log(decoded);

      await Doctor.findById(decoded.id);

      next();
    } catch (error) {
      console.log("failed token");
      res.status(401);
      throw new Error("Not authorized, token fail");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not Autherized");
  }
});

module.exports = { adminProtect, userProtect, doctorProtect };
