var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var BlogCommentSchema = new Schema({
    slug: Number,//发布的文章id
    user_id: Number,//评论人id
    user_object_id: { type: Schema.Types.ObjectId, ref: 'user' },//查看用户头像
    createAt: {//评论时间
        type: Date,
        default: Date.now()
    },
    thumb: Array,//点赞人列表
    love: Number,//点赞数  需要按点赞数检索 所以再加一个字段
    msg: String,//评论内容
    floor: Number,//楼层
    revertnum: {//回复数
        type: Number,
        default: 0
    },
    /*
    revert:{
        r_1: {
            user_id: Number,//回复人id
            name: String,//回复人名字
            cdate: {//回复时间
                type: Date,
                default: Date.now()
            },
            msg: String,//回复内容
            at_userid: Number,//被@人id
            at_name: String//被@人名
        },
        r_2:{

        }
    }
    */
    revert: {//回复列表
        type: Object,
        default: {}
    }
}, { versionKey: false })


BlogCommentSchema.statics = {
    fetch: function(cb) {
      return this
        .find({})
        .exec(cb)
    }
}

module.exports = mongoose.model('BlogComment', BlogCommentSchema, 'blog_comment')