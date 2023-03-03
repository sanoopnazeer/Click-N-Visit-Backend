const asyncHandler = require("express-async-handler");
const nodemailer = require("nodemailer");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cookie = require("cookie-parser");
const Token = require("../models/tokenModel");
const sendEmail = require("../utils/tokenSender");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const Appointments = require("../models/appointmentModel");
const Doctor = require("../models/doctorModel");
const Otp = require("../models/OtpModel");
const moment = require("moment");
const moment_timezone = require("moment-timezone");
const dotenv = require("dotenv");
const { default: mongoose } = require("mongoose");

// const secret = 'test'

dotenv.config();

const instance = new Razorpay({
  key_id: process.env.key_id,
  key_secret: process.env.key_secret,
});

const signin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (!userExists) {
      return res.status(404).json({ message: "User doesn't exist" });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      userExists.password
    );
    if (!isPasswordCorrect) {
      return res.status(404).json({ message: "Invalid credentials" });
    }

    if (userExists.isBlocked) {
      return res
        .status(404)
        .json({ message: "You have been BLOCKED by the admin" });
    } else if (!userExists.verified) {
      return res.status(404).json({ message: "Please verify your email-id" });
    }

    const token = jwt.sign(
      { email: userExists.email, id: userExists._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1hr" }
    );

    res.cookie("access-token", token);

    return res.status(200).json({ userExists, token });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
    console.log(error);
  }
};

const registerUser = asyncHandler(async (req, res) => {
  try {
    const { firstname, lastname, gender, age, email, password } = req.body;
    let userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(404).json({ message: "User already exists" });
    }

    const user = await User.create({
      firstname,
      lastname,
      gender,
      age,
      email,
      emailToken: crypto.randomBytes(64).toString("hex"),
      password,
    });

    const token = jwt.sign(
      { email: user.email, id: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1hr" }
    );

    await sendOTPVerificationEmail(user, res);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
    console.log(error);
  }
});

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

const sendOTPVerificationEmail = async (user, res) => {
  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;

    //hash the otp
    const saltRounds = 10;

    const hashedOTP = await bcrypt.hash(otp, saltRounds);
    const newOTP = new Otp({
      userId: user._id,
      otp: hashedOTP,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    });

    //save the otp record
    await newOTP.save();

    //send verfication mail to user
    var mailOptions = {
      from: '"Click N Visit" <process.env.EMAIL_USERNAME>',
      to: user.email,
      subject: "Verify to register in CLICK N VISIT",
      html: `<h2>Hi ${user.firstname}! Thank you for registering on our website.</h2>
      <p>Enter ${otp} in the app to verify your email address and complete the sign up. This OTP <b>expires in 1 hour</b>.</p>`,
    };

    //send mail
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Verification email has been sent to your account ");
      }
    });

    res.json({
      status: "pending",
      message: "An OTP is sent to your email",
      data: {
        userId: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    res.json({ status: "FAILED", message: error.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const userId = req.params.id;
    const otp = req.body.otp;
    if (!userId || !otp) {
      res.json({ message: "Empty otp details are not allowed" });
    } else {
      const otpRecord = await Otp.find({
        userId,
      });
      if (otpRecord.length <= 0) {
        //no records found
        res.json({
          message:
            "Account record doesn't exist or has been verified already. Please sign up or log in",
        });
      } else {
        //user otp record exists
        const { expiresAt } = otpRecord[0];
        const hashedOTP = otpRecord[0].otp;

        if (expiresAt < Date.now()) {
          //user otp record has expired
          await Otp.deleteMany({ userId });
          res.json({ message: "OTP has expired. Please request again." });
        } else {
          const validOTP = await bcrypt.compare(otp, hashedOTP);

          if (!validOTP) {
            //supllied otp is wrong
            res.json({ message: "Invalid OTP passed. Check your inbox." });
          } else {
            //success
            await User.updateOne({ _id: userId }, { verified: true });
            await Otp.deleteMany({ userId });
            res.json({
              verified: "true",
              message: "Your email verified successfully",
            });
          }
        }
      }
    }
  } catch (error) {
    console.log(error);
    res.json({ status: "Failed", message: "Unable to verify" });
  }
};

const resendOtp = async (req, res) => {
  try {
    const email = req.body.email;

    if (!email)
      return res.json({ message: "Empty user details are not allowed" });

    const oldUser = await User.findOne({ email });

    if (!oldUser) return res.json({ message: "User doesn't exist" });

    if (oldUser.verified === true)
      return res.json({ message: "Already Verified Please do login !" });

    const userId = oldUser._id;

    //delete existing records and resend
    await Otp.deleteMany({ userId });
    sendOTPVerificationEmail(oldUser, res);
  } catch (error) {
    res.json({ status: "Failed", message: error.message });
  }
};

const resetLink = async (req, res) => {
  try {
    const email = req.body.email;

    if (!email) return res.json({ error: "Provide an email address" });

    const oldUser = await User.findOne({ email });

    if (!oldUser) return res.json({ error: "User doesn't exist" });

    const token = jwt.sign({ id: oldUser._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1d",
    });

    if (token) {
      var mailOptions = {
        from: '"Click N Visit" <process.env.EMAIL_USERNAME>',
        to: email,
        subject: "Reset your password",
        text: `This Link is Valid only for 10 minutes http://localhost:3000/newPassword/${oldUser._id}/${token}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("error", error);
          res.json({ error: "Email not send" });
        } else {
          console.log("Email sent", info.response);
          res.json({ status: true, message: "Email sent successfully" });
        }
      });
    }
  } catch (error) {
    res.json({ error: error.message });
  }
};

const verifyUser = async (req, res) => {
  try {
    const { id, token } = req.params;

    const validUser = await User.findOne({ _id: id });

    const verifyToken = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (validUser && verifyToken.id) {
      res.json({ status: true, validUser });
    } else {
      res.json({ error: "User doesn't exist" });
    }
  } catch (error) {
    res.json({ error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { id, token } = req.params;
    const { newPassword } = req.body;

    const validUser = await User.findOne({ _id: id });

    const verifyToken = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (validUser && verifyToken.id) {
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      const setNewUserPass = await User.findByIdAndUpdate(
        { _id: id },
        { password: hashedPassword },
        { new: true }
      );

      setNewUserPass.save();

      res.json({ status: true, setNewUserPass });
    } else {
      res.json({ error: "User doesn't exist" });
    }
  } catch (error) {
    res.json({ error: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = mongoose.Types.ObjectId(req.params.id);
    const user = await User.findOne({ _id: userId });
    res.json({ userProfile: user, status: "ok" });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

const updateUserProfile = async (req, res) => {
  console.log(req.body.formValue);
  try {
    const userId = mongoose.Types.ObjectId(req.params.id);
    const updated = await User.findOneAndUpdate(
      { _id: userId },
      req.body.formData
    );
    res.json({ updatedDoc: updated, status: "ok", message: "Profile updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

const payment = async (req, res) => {
  console.log("in payment backend");
  try {
    const userId = req.params.id;
    const { docId, date, time } = req.body;
    console.log(docId, date, time);

    const user = await User.findById({ _id: userId });
    const doctor = await Doctor.findById({ _id: docId });

    const booked = await Appointments.create({
      userId: user._id,
      doctorId: doctor._id,
      userInfo: `${user.firstname} ${user.lastname}`,
      doctorInfo: `${doctor.firstname} ${doctor.lastname}`,
      date: date,
      time: time,
      amount: doctor.feesPerConsultation,
    });

    console.log(booked);
    console.log("above is booked data");
    const amount = doctor.feesPerConsultation;
    await generateRazorpay(booked._id, amount, res);
  } catch (err) {
    console.log(err);
  }
};

const generateRazorpay = async (id, amount, res) => {
  console.log("in generate rpay");
  try {
    console.log(id);
    console.log(amount);
    instance.orders.create(
      {
        amount: amount * 100,
        currency: "INR",
        receipt: `${id}`,
        notes: {
          key1: "value3",
          key2: "value2",
        },
      },
      (err, order) => {
        console.log(order);
        res.json({ status: true, order: order });
      }
    );
  } catch (error) {
    console.log(error);
    res.json({
      status: "Failed",
      message: error.message,
    });
  }
};

const verifyPayment = async (req, res) => {
  console.log("in verify payment");
  try {
    console.log(req.body);

    //creating hmac object
    let hmac = crypto.createHmac("sha256", process.env.key_secret);

    //Passing the data to be hashed
    hmac.update(
      req.body.res.razorpay_order_id + "|" + req.body.res.razorpay_payment_id
    );

    //creating the hmac in the required format
    const generated_signature = hmac.digest("hex");

    var response = { signatureIsValid: "false" };
    if (generated_signature === req.body.res.razorpay_signature) {
      response = { signatureIsValid: "true" };
      console.log("signatureIsvalid");

      changePaymentStatus(req.body.order, res);
      // res.json(response);
    } else {
      res.send(response);
    }
  } catch (err) {
    console.log(err);
  }
};

const changePaymentStatus = async (req, res) => {
  console.log("in change payment status");
  console.log(req);
  try {
    await Appointments.findOneAndUpdate(
      { _id: req.receipt },
      {
        $set: {
          paymentStatus: "Completed",
        },
      }
    );
    console.log("status changed success");
    res.json({ status: true, message: "Payment Successfull !" });
  } catch (error) {
    console.log("failed");
    res.json({ error: "Payment Failed !" });
  }
};

// CHECK AVAILIBILITY
const checkAvailability = async (req, res) => {
  try {
    const date = req.body.appointmentData.date;
    const fromTime = req.body.appointmentData.time;

    const toTimeObj = moment(fromTime, "h:mm a");
    const toTimeUnformatted = toTimeObj.add(15, "minutes");

    const toTime = toTimeUnformatted.format("h:mm a");

    const docId = req.body.appointmentData.docId;
    const doctor = await Doctor.findById(docId);
    console.log(doctor.timings[0]);
    if (
      fromTime >= doctor.timings[0] &&
      fromTime <= doctor.timings[1]
    ) {
      const appointments = await Appointments.find({
        doctorId: docId,
        date: date,
        time: { $gte: fromTime, $lte: toTime },
      });
      console.log(date, fromTime, toTime);
      if (appointments.length > 0) {
        return res
          .status(200)
          .send({ message: "Slot not available at this time" });
      } else {
        return res.status(200).send({
          appointmentData: req.body.appointmentData,
          message: "Slot available",
          success: true,
        });
      }
    }else{
      console.log("not avilabel");
      return res
        .status(200)
        .send({ message: "Doctor unavailable at this time" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

const getUserAppointments = async (req, res) => {
  try {
    const user = req.params.id;
    const appointments = await Appointments.find({ userId: user }).sort({
      createdAt: -1,
    });
    res.json({ appointmentsDetails: appointments, status: "ok" });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

module.exports = {
  registerUser,
  signin,
  // bookAppointment,
  checkAvailability,
  getUserAppointments,
  payment,
  generateRazorpay,
  verifyPayment,
  changePaymentStatus,
  getUserProfile,
  updateUserProfile,
  verifyOTP,
  resendOtp,
  resetLink,
  verifyUser,
  changePassword,
};
