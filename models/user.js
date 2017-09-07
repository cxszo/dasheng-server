
var mongoose = require('mongoose')
var bcrypt = require('bcrypt')
var SALT_WORK_FACTOR = 10;
var headimg_default = ['323.jpg', '344.jpg', '3545.jpg', '5656.jpeg', '878.jpg', '8980.jpg', '9887.jpg'];

var UserSchema = new mongoose.Schema({
    user_id: Number,
    username: {
        type: String,
        unique: true
    },
    callphone: {
      type: Number,
      unique: true
    },
    /*
    1 普通用户
    2 管理员
    */
    role: {
      type: Number,
      default: 1
    },
    password: String,
    headimg: String,//注册的时候 默认帮用户设置一个默认头像
    sex: {//性别 1男 2女
      type: String,
      default: ''
    },
    meta: {
        createAt: {
            type: Date,
            default: Date.now()
        },
        updateAt: {
            type: Date,
            default: Date.now()
        }
    }
}, { versionKey: false })




UserSchema.pre('save', function(next) {
  var user = this
  if (this.isNew) {
    this.meta.createAt = this.meta.updateAt = Date.now()
  }
  else {
    this.meta.updateAt = Date.now()
  }

  this.headimg = 'http://ov0zo91tq.bkt.clouddn.com/headimg/default/'+headimg_default[Math.floor(Math.random()*8)];
  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    if (err) return next(err)
    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) return next(err)
      user.password = hash
      next()
    })
  })
})

UserSchema.methods = {
  comparePassword: function(_password, cb) {
    bcrypt.compare(_password, this.password, function(err, isMatch) {
      if (err) return cb(err)
      cb(null, isMatch)
    })
  }
}

UserSchema.statics = {
  fetch: function(cb) {
    return this
      .find({})
      .sort('meta.updateAt')
      .exec(cb)
  },
  findById: function(id, cb) {
    return this
      .findOne({_id: id})
      .exec(cb)
  },
  findUserList: function(cb){
    return this
    .find({}, '-_id -__v')
    .sort('meta.updateAt')
    .exec(cb)
  }
}

module.exports = mongoose.model('user', UserSchema)
