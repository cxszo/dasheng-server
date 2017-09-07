

.populate('user_object_id', '-_id headimg')
.populate('user_object_id', ['-_id', 'headimg'])
.populate({
    path: 'user_object_id',//类型：String或Object。
    // 　　String类型的时， 指定要填充的关联字段，要填充多个关联字段可以以空格分隔。
    // 　　Object类型的时，就是把 populate 的参数封装到一个对象里。当然也可以是个数组。下面的例子中将会实现。
    match: { age: { $gte: 21 }},//类型：Object，可选，指定附加的查询条件。
    select: '-_id headimg username sex',//类型：Object或String，可选，指定填充 document 中的哪些字段。
    // 　　Object类型的时，格式如:{name: 1, _id: 0},为0表示不填充，为1时表示填充。
    // 　　String类型的时，格式如:"name -_id"，用空格分隔字段，在字段名前加上-表示不填充。详细语法介绍 query-select
    options: { limit: 5 },//类型：Object，可选，指定附加的其他查询选项，如排序以及条数限制等等。
    model: 'modelName'//类型：Model，可选，指定关联字段的 model，如果没有指定就会使用Schema的ref。
})



var mongoose = require('mongoose')
var Schema = mongoose.Schema
var BlogUserSchema = new Schema({
    user_id: String,
    following: [{ type: Schema.Types.ObjectId, ref: 'BlogUser' }],//关注
    name: String,
    // followers: Array,//粉丝
    // collect: Array,//收藏文章列表
    // likelist: Array,//喜欢文章列表
    // articlenum: Array,//已发布的文章
    // love: Number,//文章点赞数
    say: String,//String 个人介绍
    // sex: String//性别 1男 2女
}, { versionKey: false })



wangwei = new BlogUser({
    name:'王炜',
    say:'我是王炜'
})
zhishan = new BlogUser({
    name:'志山',
    say:'我是志山'
})
yecheng = new BlogUser({
    name:'业成',
    say:'我是业成'
})
wangwei.save((err)=>{
        if(err) throw err;
        zhishan.following.push(wangwei);
        zhishan.save((err)=>{
            if(err) throw err;
            yecheng.following.push(zhishan);
            yecheng.save();
        });
})



BlogUser.findOne({name:'志山'}).populate({
    path:'following',
    populate: { 
        path: 'following',
        populate: {path:'following'}
    }
}).exec((err, _data)=>{
    res.contentType('json');
    res.send({
        code:'1',
        data: _data,
        desc:'查询成功'
    });
    return false;
})

drawApply.find().populate({
    path: 'salesId',
    select: '_id name phone merchant',
    model: 'sales',
    populate: {
        path: 'merchant',
        select: '_id sname',
        model: 'merchant'
    })
    .populate('approver', 'name')
    .populate('operator', 'name')
    .sort({createTime: -1}).exec(function(err, list) {
  // list of drawApplies with salesIds populated and merchant populated
});