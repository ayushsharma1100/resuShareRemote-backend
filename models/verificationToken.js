let mongoose = require('mongoose');

let VerificationToken = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600
    }
})

let VerificationTokenModel = mongoose.model("verificationToken", VerificationToken);
module.exports = VerificationTokenModel;