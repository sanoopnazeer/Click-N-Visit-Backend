const router = require('express').Router();
const { newMessage, getMessages } = require('../controllers/messageControllers');

//add
router.post('/newMessage', newMessage)

//get
router.get('/getMessages/:convoId', getMessages)


module.exports = router