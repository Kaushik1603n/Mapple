const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    userEmail:{
        type: String,
        unique: true,
        required: true
    },
    referralCode: {
        type: String,
        unique: true,
        required: true
    },
    referredUsers:{
        type: String,
        required: true
    },
    // referredUsers: [
    //     {
    //         userId: { 
    //             type: mongoose.Schema.Types.ObjectId, 
    //             ref: 'User' 
    //         },
    //         joinedAt: { 
    //             type: Date, 
    //             default: Date.now 
    //         }
    //     }
    // ],
    // referralBonus: {
    //     type: Number,
    //     default: 0
    // },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Referral = mongoose.model('Referral', referralSchema);

module.exports = Referral;
