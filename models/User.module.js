const mongoose = require('../db/db')

const user = new mongoose.Schema({
    googleId: {
        required: false,
        type: String
    },
    telegramId: {
        required: false,
        type: String
    },
    facebookId: {
        required: false,
        type: String
    },
    username: {
        required: false,
        type: String
    },
    img:{
        required:false,
        type: String
    },
    status:{
        required:true,
        default:false,
        type:Boolean
    }
});

module.exports = mongoose.model("User", user);
