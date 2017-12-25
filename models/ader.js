
const mongoose = require('mongoose');


const aderSchema = new mongoose.Schema({

    name: String,
    createDate: { type: Date, default: new Date() },

    balance: Number,
    payout: Number,
    income: Number,

    partnerBonus: {
        partnerId: mongoose.Schema.Types.ObjectId,
        income: Number,
        bonus: Number
    },

    info: {
        phone: String,
        descript: String
    }
});

const aderModel = mongoose.model('ader', aderSchema);

