const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const doctorSchema = mongoose.Schema(
  {
    firstname: {
      type: String,
      required: [true, 'First name is required'],
    },
    lastname: {
      type: String,    
      required: [true, 'Last name is required'],
    },
    email: {
      type: String,
      required: [true, 'Email name is required'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    specialization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    license: {
      type: String,
      required: [true, 'license is required']
    },
    experience: {
      type: String,
      required: [true, 'Experience is required']
    },
    feesPerConsultation: {
      type: Number,
      required: [true, 'Fees is required']
    },
    timings: {
      type: Object,
      required: [true, 'Provide your timing']
    },
    verified: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: String,
      default: "pending",
    },
    // pic: {
    //   type: String,
    //   required: true,
    //   default:
    //     "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
    // },
  },
  {
    timestamps: true,
  }
);

doctorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const Doctor = mongoose.model("Doctor", doctorSchema);

module.exports = Doctor;
