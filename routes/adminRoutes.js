var express = require('express');
var router = express.Router();
const { adminSignin, adminSignup, allUsers, unblockUser, blockUser, allDoctors, blockDoctor, unblockDoctor, pendingApprovals, approve, addCategory, getCategories, deleteCategory, allAppointments, getPaidAppointments, getAllDetails } = require('../controllers/adminControllers');
const { adminProtect } = require('../middlewares/authMiddleware');

router.post("/adminLogin", adminSignin);
router.post("/adminSignup", adminSignup);
router.get('/getUsers',adminProtect, allUsers)
router.get('/blockUser/:id',adminProtect, blockUser)
router.get('/unblockUser/:id',adminProtect, unblockUser)
router.get('/getDoctors',adminProtect, allDoctors)
router.get('/blockDoctor/:id',adminProtect, blockDoctor)
router.get('/unblockDoctor/:id',adminProtect, unblockDoctor)
router.get('/pendingApprovals',adminProtect, pendingApprovals)
router.get('/approve/:id',adminProtect, approve)
router.get('/getCategories', getCategories)
router.post('/addCategory',adminProtect, addCategory)
router.get('/deleteCategory/:id',adminProtect, deleteCategory)
router.get('/allAppointments',adminProtect, allAppointments)
router.get('/getPaidAppointments', adminProtect, getPaidAppointments)
router.get('/getAllDetails', adminProtect, getAllDetails)

module.exports = router;