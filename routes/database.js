var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    /* Fixed */
    relate: {
        openId: String
    },
    signDate: Date,
    /* Free */
    name: String,
    finishedAppids: [String]
});

var partnerSchema = new Schema({
    /* Fixed */
    signDate: Date,
    /* Free */
    name: String,
    balance: Number
});

var aderSchema = new Schema({
    /* Fixed */
    signDate: Date,
    /* Free */
    name: String,
    balance: Number
});

var adSchema = new Schema({
    /* Snap */
    aderId: Schema.Types.ObjectId,
    appid: String,
    /* Free */
    isDefault: Boolean,
    count: Number,
    nick_name: String,
    access_token: String,
    refresh_token: String,
    state: String, //'OPEN', 'SUCCESS', 'FAIL'
    date: Date
});

var adminSchema = new Schema({
    /* Fixed */
    isRoot: Boolean,
    signDate: Date,
    /* Free */
    name: String,
    balance: Number
});

var deviceSchema = new Schema({
    /* Snap */
    partnerId: Schema.Types.ObjectId,
    type: String, //'JUANZHI', 'ZHIJIN'
    city: String,
    devNo: String,
    income: Number,
    /* Free */
    name: String,
    state: String, //'OPEN', 'CLOSE', 'TEST'
    signDate: Date
});

var deviceOrderSchema = new Schema({
    /* Relate */
    userId: Schema.Types.ObjectId,
    partnerId: Schema.Types.ObjectId,
    type: String,
    city: String,
    devNo: String,
    income: Number,
    /* Free */
    state: String, //'OPEN', 'SUCCESS', 'FAIL', 'TAKED'
    /* Fixed */
    date: Date
});

var incomeOrderSchema = new Schema({
    /* Relate */
    userId: Schema.Types.ObjectId,
    deviceId: Schema.Types.ObjectId,
    /* Fixed */
    channel: String, //'WXPAY'
    income: Number,
    date: Date,
    /* Free */
    state: String //'OPEN', 'SUCCESS', 'FAIL'
});



var userModel = mongoose.model('user', userSchema);
var partnerModel = mongoose.model('partner', partnerSchema);
var aderModel = mongoose.model('ader', aderSchema);
var adModel = mongoose.model('ad', adSchema);
var adminModel = mongoose.model('admin', adminSchema);
var deviceModel = mongoose.model('device', deviceSchema);
var deviceOrderModel = mongoose.model('deviceOrder', deviceOrderSchema);
var incomeOrderModel = mongoose.model('incomeOrder', incomeOrderSchema);

