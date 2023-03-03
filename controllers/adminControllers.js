const asyncHandler = require("express-async-handler");
const Admin = require("../models/adminModel");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Doctor = require("../models/doctorModel");
const Category = require("../models/CategoryModel");
const Appointments = require("../models/appointmentModel");

const adminSignin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const adminExists = await Admin.findOne({ email });
    if (!adminExists) {
      return res.status(404).json({ message: "Admin doesn't exist" });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      adminExists.password
    );
    if (!isPasswordCorrect) {
      return res.status(404).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { email: adminExists.email, id: adminExists._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1hr" }
    );
    return res.status(200).json({ adminExists, token });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
    console.log(error);
  }
};

const adminSignup = asyncHandler(async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;
    let adminExists = await Admin.findOne({ email });

    if (adminExists) {
      return res.status(404).json({ message: "Admin already exists" });
    }

    const admin = await Admin.create({
      firstname,
      lastname,
      email,
      password,
    });

    const token = jwt.sign(
      { email: admin.email, id: admin._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1hr" }
    );

    res.status(201).json({ admin, token });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
    console.log(error);
  }
});

const allUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json({ userDetails: users, status: "ok" });
  } catch (err) {
    res.status(500).json(err);
  }
};

const blockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.updateOne(
      { _id: userId },
      { $set: { isBlocked: true } }
    );
    res.json({ userDetails: user, status: "ok" });
  } catch (error) {
    res.status(500).json(error);
  }
};

const unblockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.updateOne(
      { _id: userId },
      { $set: { isBlocked: false } }
    );
    res.json({ userDetails: user, status: "ok" });
  } catch (error) {
    res.status(500).json(error);
  }
};

const allDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().populate("specialization");
    res.json({ doctorDetails: doctors, status: "ok" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

const blockDoctor = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const doctor = await Doctor.updateOne(
      { _id: doctorId },
      { $set: { isBlocked: true } }
    );
    res.json({ doctorDetails: doctor, status: "ok" });
  } catch (error) {
    res.status(500).json(error);
  }
};

const unblockDoctor = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const doctor = await Doctor.updateOne(
      { _id: doctorId },
      { $set: { isBlocked: false } }
    );
    res.json({ doctorDetails: doctor, status: "ok" });
  } catch (error) {
    res.status(500).json(error);
  }
};

const pendingApprovals = async (req, res) => {
  try {
    const approvalList = await Doctor.find({ isApproved: false }).populate(
      "specialization"
    );
    res.json({ approvalDetails: approvalList, status: "ok" });
  } catch (error) {
    res.status(500).json(error);
  }
};

const approve = async (req, res) => {
  try {
    const consId = req.params.id;
    const approved = await Doctor.updateOne(
      { _id: consId },
      { $set: { isApproved: true } }
    );
    res.json({ approvalDetails: approved, status: "ok" });
  } catch (error) {
    res.status(500).json(error);
  }
};

const addCategory = async (req, res) => {
  try {
    const { category } = req.body;
    const catExists = await Category.findOne({ category });
    if (catExists) {
      return res.status(404).json({ message: `${category} already exists` });
    }
    const newCategory = await Category.create({ category });
    res.json({ category: newCategory, status: "ok" });
  } catch (error) {
    res.status(500).json(error);
  }
};

const getCategories = async (req, res) => {
  try {
    const categoriesList = await Category.find();
    res.json({ categoryDetails: categoriesList, status: "ok" });
  } catch (error) {
    res.status(500).json(error);
  }
};

const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.deleteOne({ _id: categoryId });
    res.json({ categoryList: category, status: "ok" });
  } catch (error) {
    res.status(500).json(error);
  }
};

const allAppointments = async (req, res) => {
  try {
    const appointments = await Appointments.find().sort({ createdAt: -1 });
    res.json({ allAppointments: appointments, status: "ok" });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

const getPaidAppointments = async (req, res) => {
  try {
    const paidAppointments = await Appointments.find({
      status: "approved",
      paymentStatus: "Completed",
    }).sort({ createdAt: -1 });
    res.json({ paidAppointments: paidAppointments, status: "ok" });
  } catch (error) {
    res.status(500).json(error);
  }
};

// const getAllDetails = async (req, res) => {
//   try {
//     const totalUsers = await User.countDocuments();
//     const totalDoctors = await Doctor.countDocuments();
//     const result = await Appointments.aggregate([
//       {
//         $match: {
//           $and: [
//             { status: "approved" },
//             { paymentStatus : "Completed" },
//           ]
//         },
//       },
//       {
//         $group: {
//           _id: 0,
//           totalAmount: { $sum: "$amount" },
//         },
//       },
//     ]);

//     const totalRevenue = result[0].totalAmount
//     res.status(200).json({totalUsers, totalDoctors, totalRevenue})
//   } catch (error) {
//     res.status(500).json(error);
//   }
// };

const getAllDetails = async (req, res) => {
  try {
      const numUsers = await User.countDocuments();
      const numDoctors = await Doctor.countDocuments();
      const numBookings = await Appointments.countDocuments();
      const bookingDetails = await Appointments.find();

      const result = await Appointments.aggregate([
          { $match: {
            $and: [
              { status: "approved" },
              { paymentStatus: "Completed" },
            ],
          }, },
          {
              $group: {
                  _id: 0,
                  totalAmount: { $sum: '$amount' }
              }
          }
      ]);
      const bookingTotal = result[0].totalAmount;

      var totalAmounts
      var createdAtDates

      Appointments.aggregate([
          {
              $group: {
                  _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                  totalAmount: { $sum: "$amount" }
              }
          },
          {
              $sort: { _id: 1 }
          },
          {
              $project: {
                  _id: 0,
                  totalAmount: 1,
                  createdAt: { $dateFromString: { dateString: "$_id" } }
              }
          }
      ]).exec((err, result) => {
          if (err) throw err;
          totalAmounts = result.map(item => item.totalAmount);
          createdAtDates = result.map(item => item.createdAt);
          res.json({ numUsers, numDoctors, numBookings, bookingTotal, totalAmounts, createdAtDates, bookingDetails });
      });
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  adminSignin,
  adminSignup,
  allUsers,
  blockUser,
  unblockUser,
  allDoctors,
  blockDoctor,
  unblockDoctor,
  pendingApprovals,
  approve,
  addCategory,
  getCategories,
  deleteCategory,
  allAppointments,
  getPaidAppointments,
  getAllDetails,
};
