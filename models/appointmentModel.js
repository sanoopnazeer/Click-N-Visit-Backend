const mongoose = require("mongoose");

const appointmentSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    doctorId: {
      type: String,
      required: true,
    },
    doctorInfo: {
      type: String,
      required: true,
    },
    userInfo: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "pending",
    },
    time: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
    },
    paymentStatus: {
      type: String,
      default: "pending",
    },
  },
  { timestamps: true }
);

const Appointments = mongoose.model("appointments", appointmentSchema);

module.exports = Appointments;
