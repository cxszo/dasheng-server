var mongoose = require('mongoose')

var BlogTagSchema = new mongoose.Schema({
    id: String,// 栏目id
    name: String,// 栏目名
    subset: [
        {
            id: String, // 子栏目id
            name: String// 子栏目名
        }
    ]
}, { versionKey: false })


BlogTagSchema.statics = {
    fetch: function(cb) {
      return this
        .find({}, '-_id id name subset')
        .exec(cb)
    }
}

module.exports = mongoose.model('BlogTag', BlogTagSchema, 'blog_tag')