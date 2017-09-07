var mongoose = require('mongoose')

var BlogNoteArticleSchema = new mongoose.Schema({
    user_id: Number,
    id: Number,//文章id
    note_id: Number,// 父级笔记本id
    slug: Number,//发布用的文章id
    title: String,// 文章标题
    body: String,// 文章内容
    seq_in_nb: Number,//排序
    createAt: {// 创建时间
        type: Date,
        default: Date.now()
    },
    deleteAt: {// 删除时间
        type: Date,
        default: ''
    },
    type: {//1私密 2已发布 3发布更新
        type: Number,
        default: 1
    },
    is_show: {// 是否删除 true 没有被删除 false反之
        type: Boolean,
        default: true
    },
    note_type: {//plain   markdown
        type: String,
        default: 'markdown'
    },
    tag: {//文章大分类 默认放在推荐里面
        type: String,
        default: 1
    },
    tag_item: {//小分类
        type: String,
        default: ''
    },
    history: {//先不做放着 
        type: Array,
        default: []
    }
}, { versionKey: false })


BlogNoteArticleSchema.statics = {
    fetch: function(cb) {
      return this
        .find({})
        .exec(cb)
    }
}

module.exports = mongoose.model('BlogNoteArticle', BlogNoteArticleSchema, 'blog_note_article')