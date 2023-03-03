const Conversation = require("../models/conversationModel");
const Appointments = require("../models/appointmentModel");

const newConversation = async (req, res) => {
    console.log("inside new convo");
    const conversation = await Conversation.findOne({
        members: { $all: [req.params.senderId, req.params.receiverId] },
    });
    if(conversation){
        console.log("convo exist");
        return res.status(200).json({ conversation: conversation, status: "ok" });
    }else{
        console.log("no exist");
      const newConversation = new Conversation({
        members: [req.params.senderId, req.params.receiverId],
      });
      try {
          const conversation = await newConversation.save();
          res.status(200).json({ conversation });
        } catch (error) {
            res.status(500).json(error);
        }
    }
};

const getConversation = async (req, res) => {
  try {
    const userId = req.params.userId;
    const conversation = await Conversation.find({ members: { $in: userId } });
    res.status(200).json({ conversation: conversation, status: "ok" });
  } catch (error) {
    res.status(500).json(error);
  }
};

const getBookedDoctors = async (req, res) => {
  try {
    console.log("inside getbookeddoctors backend");
    const userId = req.params.userId;
    console.log(userId);
    const completedAppointments = await Appointments.find({
      userId: userId,
      status: "approved",
      paymentStatus: "Completed",
    });
    console.log(completedAppointments);
    res
      .status(200)
      .json({ bookedDoctors: completedAppointments, status: "ok" });
  } catch (error) {
    res.status(500).json(error);
  }
};

const findConvo = async (req, res) => {
  try {
    console.log("inside newconvo backend");
    const senderId = req.params.firstUserId;
    const receiverId = req.params.secondUser;
    const conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });
    console.log(conversation);
    res.status(200).json({ conversation: conversation, status: "ok" });
  } catch (error) {
    res.status(500).json(error);
  }
};

module.exports = {
  newConversation,
  getConversation,
  getBookedDoctors,
  findConvo,
};
