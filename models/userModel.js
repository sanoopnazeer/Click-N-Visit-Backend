const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = mongoose.Schema(
    {
      firstname: {
        type: String,
        required: true,
      },
      lastname: {
        type: String,
        required: true,
      },
      gender: {
        type: String,
        required: true,
      },
      age: {
        type: Number,
        required: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
      },
      emailToken: {
        type: String
      },
      password: {
        type: String,
        required: true,
      },
      verified: {
        type: Boolean,
        default: false
      },
      isBlocked: {
        type: Boolean,
        default: false
      },
      wallet: {
        type: Number,
        trim: true
      }
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


  userSchema.pre('save', async function (next){
    if(!this.isModified("password")){
      next();
    }
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
  })


  const User = mongoose.model('User', userSchema)

  module.exports = User