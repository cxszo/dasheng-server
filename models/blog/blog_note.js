var mongoose = require('mongoose')

var BlogNoteSchema = new mongoose.Schema({
    user_id: Number,
    id: Number,//note-id
    name: String,//note-name
    createAt: {//创建时间
        type: Date,
        default: Date.now()
    },
    is_show: {// 是否删除 true 没有被删除 false 被删除（当为false时 subset里面的文章 is_show全部变成false）
        type: Boolean,
        default: true
    },
    seq: Number//排序
}, { versionKey: false })


BlogNoteSchema.statics = {
    fetch: function(cb) {
      return this
        .find({})
        .exec(cb)
    }
}

module.exports = mongoose.model('BlogNote', BlogNoteSchema, 'blog_note')