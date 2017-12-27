
const mongoose = require('mongoose');
const cryptHelper = require('../helpers/crypt');
const ObjectId = mongoose.Schema.Types.ObjectId;


const staffSchema = new mongoose.Schema({

    logid:                  { type: String,             required: true, index: true, unique: true },
    password:               { type: String,             required: true, set: cryptHelper.PasswordCrypt },
    name:                   { type: String,             required: true },
    createDate:             { type: Date,               default: new Date() },

    character:              { type: String,             required: true }, //'MANAGER', 'NORMAL'

    info: {
        lastDate:           Date,
        loginTimes:         { type: Number,             default: 0 }
    }
});

let staffModel = null;
try {
    staffModel = mongoose.model('staff', staffSchema);
} catch(err) {
    if (err.name === 'OverwriteModelError') {
        staffModel = mongoose.model('staff');
    }
}


const CheckPassword = exports.CheckPassword = (param, callback) => {
    if( !param ||
        !param.logid ||
        !param.password ) {
        callback(new Error('param is error'));
        return ;
    }

    staffModel.findOne({ logid: param.logid })
    .exec(function (err, staff) {
        if( !staff ) {
            callback(new Error('can not find staff'));
        } else {
            callback(null, cryptHelper.PasswordCompare({
                passwordAuth: param.password,
                passwordCrypt: staff.password
            }));
        }
    });
}
