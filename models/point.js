
const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;


const pointSchema = new mongoose.Schema({

    createDate:             { type: Date,               default: new Date() },

    partnerId:              { type: ObjectId,           required: true, index: true },
    type:                   { type: String,             required: true }, //'ZHIJIN', 'ZHIJINJI'
    state:                  { type: String,             default: 'OPEN' }, //'OPEN', 'DEPLOY', 'TEST', 'CLOSE'

    deviceInfo: {
        devNo:              String,
        type:               String, //'JUANZHI', 'ZHIJIN'
        state:              String
    },

    deployInfo: {
        payout:             Number,
        name:               String,
        shop:               String,
        operatorWechatId:   String
    },

    info: {
        descript:           String
    }
});

let pointModel = null;
try {
    pointModel = mongoose.model('point', pointSchema);
} catch(err) {
    if (err.name === 'OverwriteModelError') {
        pointModel = mongoose.model('point');
    }
}


const GetPointById = exports.GetPointById = (param, callback) => {
    if( !param
        || !param.pointId ) {
        return callback(new Error('GetAdById: param is error'));
    }

    pointModel.findById(param.pointId, callback);
}

const UpdateZhijinji = exports.UpdateZhijinji = (param, callback) => {
    if( !param
        || !param.devNo
        || !param.type
        || !param.state
        || !param.partnerId ) {
        returncallback(new Error('UpdateZhijinji: param is error'));
    }

    pointModel.findOne({ 'deviceInfo.devNo': param.devNo }, (err, point) => {
        if( err
            || !point ) {
            pointModel.create({ 
                partnerId: param.partnerId,
                type: 'ZHIJINJI',
                deviceInfo: {
                    devNo: param.devNo,
                    type: param.type,
                    state: param.state
                }
            }, callback);
        } else {
            point.deviceInfo.type = param.type;
            point.deviceInfo.state = param.state;
            point.save(callback);
        }
    });
}