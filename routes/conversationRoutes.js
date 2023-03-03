const router = require('express').Router();
const { newConversation, getConversation, getBookedDoctors, findConvo } = require('../controllers/conversationControllers');
const Conversation = require('../models/conversationModel')

//new conv
router.post('/newConvo/:senderId/:receiverId', newConversation)

//get conv of a user
router.get('/getConvo/:userId', getConversation)

router.get('/getBookedDoctors/:userId', getBookedDoctors)

router.get('/findConvo/:firstUser/:secondUser', findConvo)


module.exports = router