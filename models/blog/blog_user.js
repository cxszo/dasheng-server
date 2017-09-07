var mongoose = require('mongoose')
var Schema = mongoose.Schema
var BlogUserSchema = new Schema({
    user_id: Number,//给用户看的
    user_object_id: { type: Schema.Types.ObjectId, ref: 'user' },//后端用的用户唯一id
    following: [{ type: Schema.Types.ObjectId, ref: 'BlogUser' }],//关注
    followers: [{ type: Schema.Types.ObjectId, ref: 'BlogUser' }],//粉丝
    collect: [{ type: Schema.Types.ObjectId, ref: 'BlogArticle' }],//收藏文章列表
    likelist: [{ type: Schema.Types.ObjectId, ref: 'BlogArticle' }],//喜欢文章列表
    love: Number,//文章被点赞数
    articlenum: {//已发布文章数 默认0 查看用户信息的时候才会更新
        type: Number,
        default: 0
    },
    say: String//String 个人介绍
    
}, { versionKey: false })



BlogUserSchema.pre('save', (next)=>{
    next()
})

BlogUserSchema.statics = {
    fetch: function(cb) {
      return this
        .find({})
        .exec(cb)
    }
}

module.exports = mongoose.model('BlogUser', BlogUserSchema, 'blog_user')