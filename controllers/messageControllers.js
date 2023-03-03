const Message = require("../models/messageModel");

const newMessage = async (req, res) => {
  const newMessage = new Message(req.body);
  console.log(newMessage)
  console.log("inside backned");
  try {
    const savedMessage = await newMessage.save();
    res.status(200).json({savedMessage: savedMessage, status: 'ok'});
  } catch (error) {
    res.status(500).json(error);
  }
};

const getMessages = async (req, res) => {
  const convoId = req.params.convoId;
  try {
    const messages = await Message.find({ conversationId: convoId });
    res.status(200).json({messages : messages, status: 'ok'});
  } catch (error) {
    res.status(500).json(error);
  }
};

module.exports = { newMessage, getMessages };
