const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    fName: {
        type: String,
        trim: true,
        required: false
    },
    lName: {
        type: String,
        trim: true,
        required: false
    },
    email: {
        type: String,
        required: false,
        trim: true,
        lowercase: true,
    },
    phoneNum: {
        type: String,
        required: true,
        unique: true,
    },
    userName: {
        type: String,
        required: false,
    },
}, {timestamps: true});

module.exports = mongoose.model('Users', UserSchema);