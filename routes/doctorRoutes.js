var express = require("express");
var router = express.Router();
const {
  doctorSignin,
  doctorSignup,
  getDoctorByCategory,
  getDoctorProfile,
  updateDoctorProfile,
  getSingleDoctor,
  getAppointmentRequests,
  updateAppointmentStatus,
  getDoctorDetails,
  getDoctorDashDetails,
  getMyPaidAppointments,
} = require("../controllers/doctorControllers");
const { doctorProtect } = require("../middlewares/authMiddleware");

router.post("/doctorLogin", doctorSignin);
router.post("/doctorSignup", doctorSignup);
router.get("/getDoctorByCategory/:id", getDoctorByCategory);
router.get("/getDoctorProfile/:id", getDoctorProfile);
router.post("/updateDoctorProfile/:id", doctorProtect, updateDoctorProfile);
router.get("/getSingleDoctor/:id", getSingleDoctor);
router.get("/getDoctorDetails/:id", getDoctorDetails);
router.get("/getAppointmentRequests/:id", doctorProtect, getAppointmentRequests);
router.post("/update-appointment-status", updateAppointmentStatus);
router.get('/getDoctorDashDetails/:docId', doctorProtect, getDoctorDashDetails)
router.get('/getMyPaidAppointments/:docId', doctorProtect, getMyPaidAppointments)

module.exports = router;
