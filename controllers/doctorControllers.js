const asyncHandler = require("express-async-handler");
const Doctor = require("../models/doctorModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { default: mongoose } = require("mongoose");
const Category = require("../models/CategoryModel");
const Appointments = require("../models/appointmentModel");
const User = require("../models/userModel");
const nodemailer = require("nodemailer");

const doctorSignin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const doctorExists = await Doctor.findOne({ email });
    if (!doctorExists) {
      return res.status(404).json({ message: "Doctor doesn't exist" });
    }

    if (doctorExists.isBlocked) {
      return res.status(404).json({ message: "BLOCKED by the admin" });
    }

    if (doctorExists.isApproved !== "approved") {
      return res.status(404).json({ message: "Approval Pending" });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      doctorExists.password
    );
    if (!isPasswordCorrect) {
      return res.status(404).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { email: doctorExists.email, id: doctorExists._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1d" }
    );
    return res.status(200).json({ doctorExists, token });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
    console.log(error);
  }
};

const doctorSignup = asyncHandler(async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      specialization,
      email,
      password,
      experience,
      feesPerConsultation,
      timings,
      license,
    } = req.body;
    let doctorExists = await Doctor.findOne({ email });

    if (doctorExists) {
      return res.status(404).json({ message: "Doctor already exists" });
    }

    const doctor = await Doctor.create({
      firstname,
      lastname,
      specialization,
      email,
      password,
      experience,
      feesPerConsultation,
      timings,
      license,
    });

    const token = jwt.sign(
      { email: doctor.email, id: doctor._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1hr" }
    );

    res.status(201).json({ doctor, token });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
    console.log(error);
  }
});

const getDoctorByCategory = async (req, res) => {
  try {
    const catId = mongoose.Types.ObjectId(req.params.id);
    const doctors = await Doctor.find({
      specialization: catId,
      isApproved: "approved",
    }).populate("specialization");
    console.log(doctors);
    res.json({ doctorDetails: doctors, status: "ok" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

const getDoctorProfile = async (req, res) => {
  try {
    const docId = mongoose.Types.ObjectId(req.params.id);
    const doctor = await Doctor.findOne({ _id: docId }).populate(
      "specialization"
    );
    res.json({ doctorProfile: doctor, status: "ok" });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

const updateDoctorProfile = async (req, res) => {
  try {
    const docId = req.body.docId
    // const docId = mongoose.Types.ObjectId(req.params.id);
    const updated = await Doctor.findOneAndUpdate(
      { _id: docId },
      req.body.formData
    );
    res.json({ updatedDoc: updated, status: "ok", message: "Profile updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

const getSingleDoctor = async (req, res) => {
  try {
    const docId = mongoose.Types.ObjectId(req.params.id);
    const doctor = await Doctor.findOne({ _id: docId }).populate(
      "specialization"
    );
    res.json({ doctorDetails: doctor, status: "ok" });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

const getAppointmentRequests = async (req, res) => {
  try {
    const docId = mongoose.Types.ObjectId(req.params.id);
    const appointmentRequests = await Appointments.find({
      doctorId: docId,
    }).sort({ createdAt: -1 });
    if (appointmentRequests) {
      return res.json({
        appointmentDetails: appointmentRequests,
        status: "ok",
      });
    } else {
      return res.json({ message: "No appointments till now" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

const getTodaysAppointmentRequests = async (req, res) => {
  try {
    const docId = mongoose.Types.ObjectId(req.params.id);
    const today = new Date();
    const dd = today.getDate().toString().padStart(2, "0");
    const mm = (today.getMonth() + 1).toString().padStart(2, "0");
    const yyyy = today.getFullYear();
    const todaysDate = `${dd}-${mm}-${yyyy}`;
    console.log(todaysDate)
    const appointmentRequests = await Appointments.find({
      doctorId: docId, date: todaysDate
    }).sort({ createdAt: -1 });
    if (appointmentRequests) {
      return res.json({
        appointmentDetails: appointmentRequests,
        status: "ok",
      });
    } else {
      return res.json({ message: "No appointments till now" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

const transporter = nodemailer.createTransport({
  host: process.env.HOST,
  service: process.env.SERVICE,
  port: Number(process.env.EMAIL_PORT),
  secure: Boolean(process.env.SECURE),
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId, status } = req.body;
    const appointment = await Appointments.findByIdAndUpdate(appointmentId, {
      status,
    });
    console.log("inside update status");
    const updated = await Appointments.findById(appointmentId);
    console.log(updated);
    const user = await User.findById(updated.userId);
    if (updated.status !== "approved" && updated.paymentStatus == "Completed") {
      await User.findByIdAndUpdate(
        { _id: updated.userId },
        { $inc: { wallet: updated.amount } }
      );
      console.log("refunded");
      await Appointments.findByIdAndUpdate(appointmentId, {
        paymentStatus: "refunded",
      });
    }
    console.log(appointment);

    //send status mail to user
    var mailOptions = {
      from: '"Click N Visit" <process.env.EMAIL_USERNAME>',
      to: user.email,
      subject: `Your appointment has been ${status} `,
      html: `<p> Hi ${user.firstname}! This email is to inform that the appointment you
      requested with Dr. ${updated.doctorInfo} on <b>${updated.date}</b> at <b>${updated.time}</b> has been <b>${status}.</b></p>`,
    };

    //send mail
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Appointment status email has been sent");
      }
    });

    res
      .status(200)
      .send({ message: "Appointment status updated", status: "ok" });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

const rejectFunction = async (req, res) => {
  try {
    const { appointmentId, status, reason } = req.body;
    const appointment = await Appointments.findByIdAndUpdate(appointmentId, {
      status,
    });
    console.log("inside update status");
    const updated = await Appointments.findById(appointmentId);
    console.log(updated);
    const user = await User.findById(updated.userId);
    if (updated.status !== "approved" && updated.paymentStatus == "Completed") {
      await User.findByIdAndUpdate(
        { _id: updated.userId },
        { $inc: { wallet: updated.amount } }
      );
      console.log("refunded");
      await Appointments.findByIdAndUpdate(appointmentId, {
        paymentStatus: "refunded",
      });
    }
    console.log(appointment);

    //send status mail to user
    var mailOptions = {
      from: '"Click N Visit" <process.env.EMAIL_USERNAME>',
      to: user.email,
      subject: `Your appointment has been ${status} `,
      html: `<p> Hi ${user.firstname}! This email is to inform that the appointment you
      requested with Dr. ${updated.doctorInfo} on <b>${updated.date}</b> at <b>${updated.time}</b> has been <b>${status} due to ${reason}.</b></p>`,
    };

    //send mail
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Appointment status email has been sent");
      }
    });

    res
      .status(200)
      .send({ message: "Appointment status updated", status: "ok" });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

const getDoctorDetails = async (req, res) => {
  try {
    const docId = req.params.id;
    console.log(docId);
    console.log("inside backend");
    const doctor = await Doctor.findById(docId);
    res.status(200).send({ doctorDetails: doctor, status: "ok" });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

const getDoctorDashDetails = async (req, res) => {
  const docId = req.params.docId;
  try {
    const totalAppointments = await Appointments.find({
      doctorId: docId,
    }).count();
    const result = await Appointments.aggregate([
      {
        $match: {
          $and: [
            { doctorId: docId },
            { status: "approved" },
            { paymentStatus: "Completed" },
          ],
        },
      },
      {
        $group: {
          _id: 0,
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);
    const totalRevenue = result[0].totalAmount;
    const pendingAppointments = await Appointments.find({
      doctorId: docId,
      status: "pending",
    }).count();
    console.log(totalAppointments, totalRevenue, pendingAppointments);
    res
      .status(200)
      .json({ totalAppointments, totalRevenue, pendingAppointments });
  } catch (error) {
    res.status(500).json(error);
  }
};

const getMyPaidAppointments = async (req, res) => {
  const docId = req.params.docId;
  try {
    const paidAppointments = await Appointments.find({
      doctorId: docId,
      status: "approved",
      paymentStatus: "Completed",
    }).sort({ createdAt: -1 });
    console.log(paidAppointments);
    res.json({ paidAppointments: paidAppointments, status: "ok" });
  } catch (error) {
    res.status(500).json(error);
  }
};

module.exports = {
  doctorSignin,
  doctorSignup,
  getDoctorByCategory,
  getDoctorProfile,
  updateDoctorProfile,
  getSingleDoctor,
  getAppointmentRequests,
  getTodaysAppointmentRequests,
  updateAppointmentStatus,
  rejectFunction,
  getDoctorDetails,
  getDoctorDashDetails,
  getMyPaidAppointments,
};
