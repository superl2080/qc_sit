
const mongoose = require('mongoose');


const pointSchema = new mongoose.Schema({

    createDate: { type: Date, default: new Date() },

    partnerId: mongoose.Schema.Types.ObjectId,
    type: String, //'POINT', 'JUANZHI', 'ZHIJIN'
    state: String, //'OPEN', 'CLOSE', 'TEST'

    deviceInfo: {
        devNo: String,
        state: String
    },

    deployInfo: {
        payout: Number,
        name: String,
        shop: String,
        operatorWechatId: String
    },

    info: {
        descript: String
    }
});

const pointModel = mongoose.model('point', pointSchema);

