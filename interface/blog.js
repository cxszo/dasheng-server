var express = require('express');
var app = express();
var router = express.Router();
var Util = require('../util')
var User = require('../models/user')
var ResCode = require('../config/resCode')
var BlogTag = require('../models/blog/blog_tag')//标签表
var BlogUser = require('../models/blog/blog_user')//博客用户表
var BlogArticle = require('../models/blog/blog_article')//已发布文章
var BlogComment = require('../models/blog/blog_comment')//评论
var BlogNoteArticle = require('../models/blog/blog_note_article')//文章
var BlogNote = require('../models/blog/blog_note')//文集
var Increment = require('../models/blog/increment')//自增

var $middlewares = require('./mount-middlewares');//获取token中间件
var async = require('async')

// 1.1首页-文章列表 炜-warning  没有做分页
router.post('/list', (req, res)=>{
    let {tag, tag_item, seek} = req.body || '';//筛选 tag 大分类 tag_item 小分类 seek用户检索标题
    let fetch_param = {is_show: true};
    if(!!seek){
        let regExp_title = new RegExp(seek+'+', 'i')
        fetch_param  = {title: regExp_title, is_show: true}
    }else if (!!tag){
        fetch_param = {tag, is_show: true}
    }else if (!!tag_item){
        fetch_param = {tag_item, is_show: true}
    }
    if(!!tag && !!tag_item){
        fetch_param = {tag, tag_item, is_show: true}
    }
    BlogArticle.find(fetch_param, '-_id user_id user_object_id title body lovenum read createAt slug img_url comment')
    .populate({
        path:'user_object_id',
        select: '-_id headimg username sex'
    })
    .sort({createAt: -1}).limit(10)//按最近时间排序 返回前10条
    .exec((err, _data)=>{
        if(err)console.log(err)
        if(_data instanceof Array){
            let resData = _data.map(item=>{
                let userid =  item.user_id || '',
                user_object_id = item.user_object_id || '',
                title =  item.title || '',
                intro =  item.body || '',
                read = item.read || 0,
                love = item.lovenum || 0,
                comment = item.comment || [],
                blogger = user_object_id.username || '',
                createAt = item.createAt || '',
                headimg = user_object_id.headimg || '',
                slug = item.slug || '',
                img_url = item.img_url || '';
                comment = item.comment;
                intro = intro.substr(0, 30)+'...';
                return {
                    userid,title,intro,read,love,comment,blogger,createAt,headimg,slug,img_url
                }
            })
            res.send({
                code:'1',
                data: resData,
                desc:'查询成功'
            });
            return false;
        }else{
            res.contentType('json');
            res.send({
                code:'-1',
                desc:'查询失败'
            });
            return false;
        }
    })
    
})

//1.2首页-查询大标签
router.get('/tag',  (req, res)=>{
    BlogTag.find({}, '-_id id name')
    .exec((err, _data)=>{
        if(err)console.log(err)
        res.contentType('json');
        res.send({
            code:'1',
            data: _data,
            desc:'查询成功'
        });
        return false;
    })
})
//1.3首页-查询小标签
router.get('/tag/:id',  (req, res)=>{
    let id = req.params.id || '';


    BlogTag.findOne({id: id}, '-_id subset')
    .exec((err, _data)=>{
        if(err)console.log(err)

        if(!_data){
            res.contentType('json');
            res.send({
                code: '-1',
                desc:'没有'+id+'的标签'
            });
            return false;
        }
        let subset = _data.subset || [];
        res.contentType('json');
        res.send({
            code: ResCode.success.c,
            data: subset,
            desc: ResCode.success.d,
        });
        return false;
    })
})

//1.4首页-优秀原创作者 炜-warning  这个接口可以静态化
router.get('/authors', (req, res)=>{
    BlogUser.find({}, '-_id user_id say user_object_id love').sort({love:-1}).limit(5)
    .populate({
        path: 'user_object_id',
        select: '-_id headimg username sex',
    })
    .exec((err, _data)=>{
        if(err)console.log(err)
        if(_data instanceof Array){
            let resData = _data.map(item=>{
                let userid = item.user_id || '',
                user_object_id = item.user_object_id || '',
                headimg = user_object_id.headimg || '',
                name = user_object_id.username || '',
                sex = user_object_id.sex || '',
                say = item.say || '',
                love = item.love || 0;
                return {
                    userid,
                    headimg,
                    name,
                    say,
                    sex,
                    love
                }
            })
            res.contentType('json');
            res.send({
                code:'1',
                data: resData,
                desc:'查询成功'
            });
            return false;
        }else{
            res.contentType('json');
            res.send({
                code:'-1',
                desc:'查询失败'
            });
            return false;
        }
    })
})


//2.1文章-内容
router.post('/article', $middlewares, (req, res)=>{
    let api_user = req.api_user || '';//当前登录用户的信息
    let {id} = req.body;

    
    async.waterfall([
        //【第一步】 查询文章信息
        (callback)=>{
            BlogArticle.findOne({slug: id, is_show: true}, '_id user_id user_object_id article_id title body createAt lovenum read comment')
            .exec((err, _data)=>{
                if(err)console.log(err)
                if(!_data){
                    res.contentType('json');
                    res.send({
                        code:'-1',
                        desc:'没有该文章'
                    });
                    return false;
                }
                callback(null, _data)
            })
        },
        //【第二步】查博主的信息
        (resData, callback)=>{
            let user_id = resData.user_id;
            BlogUser.findOne({user_id}, '_id love say collect followers likelist user_object_id')
            .populate({
                path: 'user_object_id',
                select: '-_id username headimg sex'
            })
            .exec((err, _data)=>{
                if(err)console.log(err)
                if(!_data){
                    res.contentType('json');
                    res.send({
                        code:'-1',
                        desc:'查询不到博主信息'
                    });
                    return false;
                }
                callback(null, resData, _data)//传入文章信息和博主信息
            })
        },
        //【第二步】查自己是否 关注过作者 喜欢过文章 收藏过文章
        (articleInfo, bloggerInfo, callback)=>{
            let {user_object_id, love, say, collect, followers, likelist } = bloggerInfo || '';//作者信息
            followers = followers || [];//粉丝列表
            collect = collect || [];//收藏列表
            likelist = likelist || [];//喜欢的文章列表
            user_object_id = user_object_id || '';
            let resData = {
                title: articleInfo.title || '',
                body: articleInfo.body || '',
                blogger:{
                    name: user_object_id.username || '',
                    id: articleInfo.user_id,
                    headimg: user_object_id.headimg || '',
                    love: love || 0,//博主获得总喜欢数
                    followers: followers.length,//被关注数
                    say: say||'',//个人介绍
                    sex: user_object_id.sex || ''
                },
                read: articleInfo.read||0,
                love: articleInfo.lovenum || 0,
                createAt: articleInfo.createAt,
                comment: articleInfo.comment || 0
            }
            if(typeof api_user === 'object'){//用户登录信息
                let {user_id} = api_user;//获取用户id 查询用户关注
                if(user_id == resData.blogger.id){//作者就是他自己
                    resData.is_love = (likelist.indexOf(articleInfo._id) == '-1'? false: true);
                    resData.is_collect = (collect.indexOf(articleInfo._id) == '-1'? false: true);
                    resData.is_me =  true
                    resData.article_id = articleInfo.article_id;//编辑文章用的
                }else{//作者不是他
                    resData.is_me =  false;
                    BlogUser.findOne({user_id})//查询自己信息
                    .exec((err, _data)=>{
                        if(err)console.log(err)
                        if(!_data){
                            res.contentType('json');
                            res.send({
                                code:'-1',
                                desc:'查询失败'
                            });
                            return false;
                        }

                        let {collect, likelist, following } = _data || '';//作者信息
                        collect = collect || [];//收藏人列表
                        likelist = likelist || [];//喜欢的文章列表

                        resData.is_following = (following.indexOf(bloggerInfo._id) == '-1'? false: true);
                        resData.is_love = (likelist.indexOf(articleInfo._id) == '-1'? false: true);
                        resData.is_collect = (collect.indexOf(articleInfo._id) == '-1'? false: true);
                        res.contentType('json');
                        res.send({
                            code:'1',
                            data: resData,
                            desc:'success'
                        });
                        return false;
                    })
                    return false;
                }
            }else{//没有登录
                resData.is_following = false;
                resData.is_love = false;
                resData.is_collect = false;
                resData.is_me =  false;
            }
            callback(null, resData)
        }
    ],(err, result)=>{//response 返回
        res.contentType('json');
        res.send({
            code:'1',
            data: result,
            desc:'success'
        });
        return false;
    })
})
// 2.2文章-统计阅读
router.get('/read/:id', $middlewares, (req, res)=>{

    let api_user = req.api_user||'';//登录信息
    let id = req.params.id || '';//文章id
    if(!id){
        res.contentType('json');
        res.send({
            code:'-1',
            desc:'文章id没有传'
        });
        return false;
    }

    BlogArticle.find({slug: id})
    .exec((err, _data)=>{
        if(err)console.log(err);
        if(Util.check_cb(_data) == '1'){
            let {user_id} = _data[0] || '';
            if(typeof api_user === 'object'){
                cUser_id = api_user.user_id || '';
                if(user_id == cUser_id){
                    res.contentType('json');
                    res.send({
                        code:'-1',
                        desc:'查看自己的文章不统计'
                    });
                    return false;
                }
            }
            BlogArticle.findOneAndUpdate({"slug": id},{$inc:{read:1}},{new: true}, (err, inc)=>{
                res.contentType('json');
                res.send({
                    code:'1',
                    data:{read: inc.read || ''},
                    desc:'已更新'
                });
                return false;
            })
        }else{//文章找不到
            res.contentType('json');
            res.send({
                code:'-2',
                desc:'找不到当前文章'
            });
            return false;
        }
    })

    
})
// 2.3文章-喜欢、取消喜欢
router.post('/article/love', $middlewares, (req, res)=>{
    var api_user = req.api_user || '';
    let articleId = req.body.id || '';
    if(typeof api_user == 'string'){//用户未登录 或者不存在该用户
        res.contentType('json');
        res.send({
            code: ResCode.unlogin.c,
            desc: api_user
        });
        return false;
    }
    if( articleId == '' ){//文章id 没传
        res.contentType('json');
        res.send({
            code: '-1',
            desc: '请传入文章id'
        });
        return false;
    }
    
    async.waterfall([
        //【第一步】 find 先检测文章id 可靠性
        (callback)=>{
            BlogArticle.findOne({slug: articleId, is_show: true}, '_id love')
            .exec((err, _data)=>{
                if(err)console.log(err);

                let resData = _data || '';
                let id = resData._id || '';
                let love = resData.love || [];
                if(id === ''){
                    res.contentType('json');
                    res.send({
                        code: ResCode.nofound.c,
                        desc: ResCode.nofound.d+'文章'
                    });
                    return false;
                }
                callback(null, id, love);
            })
        },
        //【第二步】 find 用户喜欢的文章列表
        (id, love, callback)=> {
            let article_objectid = id;//文章的_id
            BlogUser.findOne({user_id: api_user.user_id}, '-_id likelist')
            .exec((err, _data)=>{
                if(err)console.log(err);
                let resData = _data || '';
                let likelist = resData.likelist || '';
                if(likelist === ''){
                    res.contentType('json');
                    res.send({
                        code: ResCode.nofound.c,
                        desc: ResCode.nofound.d+'用户信息'
                    });
                    return false;
                }
                let article_objectid_index = likelist.indexOf(article_objectid)
                if(article_objectid_index>=0){//取消喜欢
                    likelist.splice(article_objectid_index, 1)
                    let love_index = '-1';
                    love.map((item, index)=>{
                        if(item.user_id == api_user.user_id){
                            love_index = index;
                        }
                    })
                    if(love_index != '-1'){//炜-warning 这里 按理说肯定不等于-1  或者不等于-1的时候应该在log里面记录一下
                        love.splice(love_index, 1)
                    }
                    callback(null, likelist, love, '取消');
                }else{//添加喜欢
                    likelist.push(article_objectid)
                    love.unshift({
                        user_id: api_user.user_id,//点赞人
                        name: api_user.username,//点赞人名
                        headimg: api_user.headimg,//点赞人头像
                        cdate: Date.now()
                    })
                    callback(null, likelist, love, '添加');
                }
            })
        },
        //【第三步】update-用户表 添加、删除喜欢
        (id, love, act, callback)=>{
            BlogUser.update({user_id: api_user.user_id}, {$set:{likelist: id}})
            .exec((err)=>{
                if(err)console.log(err);
                callback(null, love, act);
            })
        },
        //【第四步】update-文章表 添加、删除喜欢 炜-warning 这个地方有点蛋疼 文章的喜欢人列表是用Array存入数据库的 查询该用户有木有点过喜欢 得map 遍历查 很浪费性能 后面得优化
        (love, act, callback)=>{
            BlogArticle.update({slug: articleId, is_show: true}, {$set:{love: love, lovenum: love.length}})
            .exec((err)=>{
                if(err)console.log(err);
                callback(null, act);
            })
        }
    ], function (err, act) {//response
        res.contentType('json');
        res.send({
            code: ResCode.success.c,
            desc: act+ResCode.success.d
        });
    });
   
})
// 2.4文章-喜欢人列表 炜-warning 没有考虑分页
router.get('/article/loverlist/:id', (req, res)=>{
    let articleId = req.params.id || '';
    if( articleId == '' ){//文章id 没传
        res.contentType('json');
        res.send({
            code: '-1',
            desc: '请传入文章id'
        });
        return false;
    }
    async.waterfall([
        (callback)=>{
            BlogArticle.findOne({slug: articleId}, '-_id love')
            .exec((err, _data)=>{
                if(err) console.log(err);
                let resData = _data || '';
                let love = resData.love || '';
                if(love === ''){
                    res.contentType('json');
                    res.send({
                        code: ResCode.nofound.c,
                        desc: ResCode.nofound.d+'文章'
                    });
                    return false;
                }
                callback(null, love)
            })
        }
    ], (err, love)=>{
        res.contentType('json');
        res.send({
            code: ResCode.success.c,
            data: love,
            desc: ResCode.success.d
        });
        return false;
    })
})
// 2.5文章-收藏、取消收藏
router.post('/collect', $middlewares, (req, res)=>{
    var api_user = req.api_user || '';
    let articleId = req.body.id || '';
    if(typeof api_user == 'string'){//用户未登录 或者不存在该用户
        res.contentType('json');
        res.send({
            code: ResCode.unlogin.c,
            desc: api_user
        });
        return false;
    }
    if( articleId == '' ){//文章id 没传
        res.contentType('json');
        res.send({
            code: '-1',
            desc: '请传入文章id'
        });
        return false;
    }
    
    async.waterfall([
        //第一步 find 先检测文章id 可靠性
        (callback)=>{
            BlogArticle.findOne({slug: articleId, is_show: true}, '_id')
            .exec((err, _data)=>{
                if(err)console.log(err);

                let resData = _data || '';
                let id = resData._id || '';

                if(id == ''){
                    res.contentType('json');
                    res.send({
                        code: ResCode.nofound.c,
                        desc: ResCode.nofound.d+'文章'
                    });
                    return false;
                }
                callback(null, id);
            })
        },
        //第二步 find 用户喜欢的文章列表
        (id, callback)=> {
            let article_objectid = id;//文章的_id
            BlogUser.findOne({user_id: api_user.user_id}, '-_id collect')
            .exec((err, _data)=>{
                if(err)console.log(err);
                let resData = _data || '';
                let collect = resData.collect || '';
                if(collect === ''){//[] == '' 所以得用===
                    res.contentType('json');
                    res.send({
                        code: ResCode.nofound.c,
                        desc: ResCode.nofound.d+'用户信息'
                    });
                    return false;
                }
                let article_objectid_index = collect.indexOf(article_objectid)
                if(article_objectid_index>=0){//取消喜欢
                    collect.splice(article_objectid_index, 1)
                    callback(null, collect, '取消');
                }else{//添加喜欢
                    collect.push(article_objectid)
                    callback(null, collect, '添加');
                }
            })
        },
        (id, act, callback)=>{//update 添加、删除喜欢
            BlogUser.update({user_id: api_user.user_id}, {$set:{collect: id}})
            .exec((err)=>{
                if(err)console.log(err);
                callback(null, act);
            })
        }
    ], function (err, act) {//response
        res.contentType('json');
        res.send({
            code: ResCode.success.c,
            desc: act+ResCode.success.d
        });
    });
})



/*
文集
炜-warning 没有考虑分页
Method 只支持 { post get delete }
3.1 查看评论 {get}    /data/blog/comment/:id
3.2 评论    {post}    /data/blog/comment/:id
3.3 评论点赞 {post}   /data/blog/comment/:id/love
3.4 删除评论 {delete}  /data/blog/comment/:id/delete
3.5 回复评论 {post}    /data/blog/comment/:id/revert
3.6 删除回复 {delete}  /data/blog/comment/:id/delete_revert
*/

router.all(/^\/comment\/(\w+)?(\/\w+)?$/, $middlewares, (req, res)=>{
    var api_user = req.api_user || '',//本人的登录信息
    method = req.method || '',//请求方式
    param1 = req.params[0] || '',//参数1
    param2 = req.params[1] || '';//参数2
    param2 = param2.substr(1);
    if(typeof api_user == 'string' && !/^get$/i.test(method) ){//未登录的并且不是3.1 直接过滤掉
        res.contentType('json');
        res.send({
            code: ResCode.nofound.c,
            desc: api_user
        });
        return false;
    }

    var user_id = api_user.user_id || '';//用户id
    if( param1 == param2 && param1 == ''){
        res.contentType('json');
        res.send({
            code: '-1',
            desc: '请传文章id'
        });
        return false;
    }else if( param1 != '' && param2 == ''){
        if( /^post$/i.test(method) ){//3.2
            let msg = req.body.msg || '';
            if(msg == ''){
                res.contentType('json');
                res.send({
                    code: '-1',
                    desc: '请输入评论内容'
                });
                return false;
            }
            async.waterfall([
                //【step1】查文章信息
                (callback)=>{
                    BlogArticle.findOne({slug: param1}, '-_id user_id is_show comment')
                    .exec((err, _data)=>{
                        if(err)console.log(err);

                        let {user_id: u_id, is_show, comment} = _data || '';
                        if(!is_show || !_data){
                            res.contentType('json');
                            res.send({
                                code: '-1',
                                desc: '没有该文章'
                            });
                            return false;
                        }
                        let is_auther = false;//默认不是作者
                        if(user_id == u_id){
                            is_auther = true;
                        }
                        callback(null, comment, is_auther)
                    })
                },
                //【step2】评论表插入一条评论 更新文章表评论数
                (comment, is_auther, callback)=>{
                    comment = comment+1;
                    BlogArticle.update({slug: param1}, {$set:{comment}})
                    .exec((err)=>{
                        if(err)console.log(err);
                    })
                    BlogComment.create({ slug: param1, user_id, user_object_id: api_user._id, thumb:[], love:0, msg, floor:comment }, function (err, _data) {
                        if (err) return console.log(err);// 炜-warning 这里可以写个公用的方法 
                        callback(null, _data, is_auther)
                    })
                },
                //【step3】返回数据
                (resData, is_auther, callback)=>{
                    let data = {
                        id: resData._id,
                        headimg: api_user.headimg,
                        name: api_user.username,
                        userid: user_id,
                        floor: resData.floor,
                        cdate: resData.createAt,
                        msg,
                        is_me: true,
                        love: resData.love,
                        is_auther,
                        is_love: false
                    }
                    callback(null, data)
                }
            ], (err, resData)=>{
                if(err)console.log(err);
                res.contentType('json');
                res.send({
                    code: ResCode.success.c,
                    data: resData,
                    desc: '评论'+ResCode.success.d
                });
            })
            return false;
        }else if( /^get$/i.test(method) ){//3.1  炜-warning 没有考虑分页
            let order = req.query.order || 'seq';//love按喜欢排 seq按时间正序 order按时间倒序.
            if(['order', 'seq', 'love'].indexOf(order) == '-1'){
                res.contentType('json');
                res.send({
                    code: '-1',
                    desc: '排序方式不对'
                });
                return false;
            }
            async.waterfall([
                //【step1】查文章信息
                (callback)=>{
                    BlogArticle.findOne({slug: param1}, '-_id user_id is_show comment')
                    .exec((err, _data)=>{
                        if(err)console.log(err);

                        let {user_id: u_id, is_show, comment} = _data || '';
                        if(!is_show || !_data){
                            res.contentType('json');
                            res.send({
                                code: '-1',
                                desc: '没有该文章'
                            });
                            return false;
                        }
                        
                        callback(null, comment, u_id)
                    })
                },
                //【step2】查看评论
                (comment, u_id, callback)=>{
                    let b_c = BlogComment.find({slug: param1})
                              .populate({
                                    path: 'user_object_id',
                                    model: 'user',
                                    select: '-_id headimg username'
                              })
                    if(order == 'seq'){
                        b_c = b_c.sort({floor: 1})
                    }else if(order == 'order'){
                        b_c = b_c.sort({floor: -1})
                    }else if(order == 'love'){
                        b_c = b_c.sort({createAt: 1})
                    }
                    b_c.exec((err, _data)=>{
                        if(err)console.log(err);

                        if(!_data instanceof Array){
                            res.contentType('json');
                            res.send({
                                code: '-1',
                                desc: '查询失败'
                            });
                            return false;
                        }
                        callback(null, _data, comment, u_id)
                    })
                },
                //【step3】返回数据
                (resData, comment, u_id, callback)=>{
                    let isLogin = true;
                    if(typeof api_user == 'string'){//未登录
                        isLogin = false;
                    }
                    let data = resData.map(item=>{
                        let u_o_id = item.user_object_id || '';
                        let thumb = item.thumb || [];
                        return {
                            id: item._id,
                            headimg: u_o_id.headimg || '',
                            name: u_o_id.username || '',
                            userid: item.user_id || '',
                            floor: item.floor || '',
                            cdate: item.createAt,
                            msg: item.msg || '',
                            love: item.love || 0,
                            is_me: !isLogin?false: (item.user_id == user_id),//是否是自己评论
                            is_auther: (item.user_id == u_id),//是否是作者
                            is_love: thumb.indexOf(user_id)=='-1'? false:true//是否给评论点过赞
                        }
                    })
                    
                    callback(null, data, comment)
                }
            ], (err, resData, comment)=>{
                if(err)console.log(err);
                res.contentType('json');
                res.send({
                    code: ResCode.success.c,
                    data: {
                        count: comment,
                        list: resData
                    },
                    desc: ResCode.success.d
                });
            })
            return false;
        }
    }else if( param1 != '' && param2 != ''){
        if( /^post$/i.test(method) ){
            if(param2 == 'love'){//3.3
                let object_id = req.body.id || '';//评论_id
                if(object_id == ''){
                    res.contentType('json');
                    res.send({
                        code: '-1',
                        desc: '请传入将要删除的评论id'
                    });
                    return false;
                }
                async.waterfall([
                    //【step1】查询这篇文章信息
                    (callback)=>{
                        BlogArticle.findOne({slug: param1}, '-_id is_show')
                        .exec((err, _data)=>{
                            if(err)console.log(err);
    
                            let {is_show} = _data || '';
                            if(!is_show || !_data){
                                res.contentType('json');
                                res.send({
                                    code: '-1',
                                    desc: '没有该文章'
                                });
                                return false;
                            }
                            
                            callback(null)
                        })
                    },
                    //【step2】查询是否有这条评论
                    (callback)=>{
                        BlogComment.findById(object_id, '-_id slug thumb love')
                        .exec((err, _data)=>{
                            if(err)console.log(err);
                            
                            if(!_data){
                                res.contentType('json');
                                res.send({
                                    code: '-1',
                                    desc: '该文章没有这条评论，请查看评论id传的对不对'
                                });
                                return false;
                            }
                            if(_data.slug != param1){
                                res.contentType('json');
                                res.send({
                                    code: '-1',
                                    desc: '该评论不属于当前文章'
                                });
                                return false;
                            }
                            callback(null, _data)
                        })
                    },
                    //【step3】点赞
                    (resData, callback)=>{
                        let {love ,thumb} = resData || '';
                        love = love || 0;
                        thumb = thumb || [];
                        let act = ''
                        let thumb_index = thumb.indexOf(user_id);
                        if( thumb_index == '-1'){
                            love = +love +1;
                            thumb.push(user_id)
                            act = '添加'
                        }else{
                            love = love -1;
                            thumb.splice(thumb_index, 1)
                            act = '取消'
                        }
                        BlogComment.findByIdAndUpdate(object_id, {$set:{love, thumb}}, {new: true})
                        .exec((err, _data)=>{
                            if(err)console.log(err);
                            callback(null, act)
                        })
                    },
                ], (err, act)=>{
                    if(err)console.log(err);
                    res.contentType('json');
                    res.send({
                        code: ResCode.success.c,
                        desc: act+ResCode.success.d
                    });
                })
                return false;
            }
            if(param2 == 'revert'){//3.5
                let {id:object_id, u_id, msg} = req.body || '';
                if(object_id == ''){//评论id
                    res.contentType('json');
                    res.send({
                        code: '-1',
                        desc: '请传入评论id'
                    });
                    return false;
                }
                if(u_id == ''){//被@人id
                    res.contentType('json');
                    res.send({
                        code: '-1',
                        desc: '请传入被@人的id'
                    });
                    return false;
                }
                if( msg =='' ){//回复内容
                    res.contentType('json');
                    res.send({
                        code: '-1',
                        desc: '请传入回复内容'
                    });
                    return false;
                }
                async.waterfall([
                    //【step1】查询这篇文章信息
                    (callback)=>{
                        BlogArticle.findOne({slug: param1}, '-_id is_show')
                        .exec((err, _data)=>{
                            if(err)console.log(err);
    
                            let { is_show} = _data || '';
                            if(!is_show || !_data){
                                res.contentType('json');
                                res.send({
                                    code: '-1',
                                    desc: '没有该文章'
                                });
                                return false;
                            }
                            
                            callback(null)
                        })
                    },
                    //【step2】查看评论
                    (callback)=>{
                        BlogComment.findById(object_id, '-_id slug revertnum revert')
                        .exec((err, _data)=>{
                            if(err)console.log(err);
                            if(!_data){
                                res.contentType('json');
                                res.send({
                                    code: '-1',
                                    desc: '该文章没有这条评论，请查看评论id传的对不对'
                                });
                                return false;
                            }
                            if(_data.slug != param1){
                                res.contentType('json');
                                res.send({
                                    code: '-1',
                                    desc: '该评论不属于当前文章'
                                });
                                return false;
                            }
                            callback(null, _data )
                        })
                    },
                    //【step3】查询@人姓名 
                    (resData, callback)=>{
                        User.findOne({user_id: u_id}, '-_id username headimg')
                        .exec((err, _data)=>{
                            if(err)console.log(err);
                            if(!_data){
                                res.contentType('json');
                                res.send({
                                    code: '-1',
                                    desc: '没有u_id对应的这个用户'
                                });
                                return false;
                            }
                            callback(null, resData, _data)
                        })
                    },
                    //【step4】插入回复
                    (comment_info, user_info, callback)=>{
                        let {revertnum,revert} = comment_info || '';
                        let {username,headimg} = user_info || '';
                        revertnum = revertnum || 0;
                        revertnum = +revertnum+1;
                        revert = revert || {};
                        let data = {
                            user_id,//回复人id
                            name: api_user.username,//回复人名字
                            headimg: api_user.headimg,//回复人头像
                            cdate: Date.now(),//回复时间
                            msg,//回复内容
                            at_userid: u_id,//被@人id
                            at_name: username,//被@人名
                            at_headimg: headimg//被@人头像
                        }
                        revert['r_'+revertnum] = data;
                        BlogComment.update({_id: object_id}, {$set: {revertnum, revert}})
                        .exec((err)=>{
                            if(err)console.log(err);
                            data.floor = 'r_'+revertnum;
                            data.is_me = true;
                            callback(null, data)
                        })
                    }
                ], (err, resData)=>{
                    if(err)console.log(err);
                    res.contentType('json');
                    res.send({
                        code: ResCode.success.c,
                        data: resData,
                        desc: '回复'+ResCode.success.d
                    });
                })
                return false;
            }
        }
        if( /^delete$/i.test(method) ){
            if(param2 == 'delete'){//3.4
                let object_id = req.body.id || '';//评论_id
                if(object_id == ''){
                    res.contentType('json');
                    res.send({
                        code: '-1',
                        desc: '请传入要删除掉的评论id'
                    });
                    return false;
                }
                async.waterfall([
                    //【step1】查询这篇文章信息
                    (callback)=>{
                        BlogArticle.findOne({slug: param1}, '-_id is_show comment')
                        .exec((err, _data)=>{
                            if(err)console.log(err);
    
                            let { is_show, comment} = _data || '';
                            if(!is_show || !_data){
                                res.contentType('json');
                                res.send({
                                    code: '-1',
                                    desc: '没有该文章'
                                });
                                return false;
                            }
                            
                            callback(null, comment)
                        })
                    },
                    //【step2】查看评论
                    (comment, callback)=>{
                        BlogComment.findById(object_id)
                        .exec((err, _data)=>{
                            if(err)console.log(err);
                            if(!_data){
                                res.contentType('json');
                                res.send({
                                    code: '-1',
                                    desc: '该文章没有这条评论，请查看评论id传的对不对'
                                });
                                return false;
                            }
                            if(_data.slug != param1){
                                res.contentType('json');
                                res.send({
                                    code: '-1',
                                    desc: '该评论不属于当前文章'
                                });
                                return false;
                            }
                            let u_id = _data.user_id || '';
                            if(user_id != u_id){
                                res.contentType('json');
                                res.send({
                                    code: '-1',
                                    desc: '该评论不属于你，你不能删除'
                                });
                                return false;
                            }
                            callback(null, comment )
                        })
                    },
                    //【step3】删除评论 更新文章表评论数字段
                    (comment, callback)=>{
                        BlogArticle.update({slug: param1}, {$set:{comment: comment -1}}, (err)=>{
                            if(err)console.log(err);
                        })
                        BlogComment.remove({user_id, _id: object_id, slug: param1}, (err)=>{
                            if(err)console.log(err);
                            callback(null)
                        })
                    }
                ], (err)=>{
                    if(err)console.log(err);
                    res.contentType('json');
                    res.send({
                        code: ResCode.success.c,
                        desc: '删除'+ResCode.success.d
                    });
                })
                return false;
            }
            if(param2 == 'delete_revert'){//3.6
                let {id:object_id, floor} = req.body || '';
                if(object_id == ''){
                    res.contentType('json');
                    res.send({
                        code: '-1',
                        desc: '需要传入评论id'
                    });
                    return false;
                }
                if(!/^r_\d+$/.test(floor)){
                    res.contentType('json');
                    res.send({
                        code: '-1',
                        desc: '楼层编号不对'
                    });
                    return false;
                }
                async.waterfall([
                    //【step1】查询这篇文章信息
                    (callback)=>{
                        BlogArticle.findOne({slug: param1}, '-_id is_show')
                        .exec((err, _data)=>{
                            if(err)console.log(err);
    
                            let { is_show} = _data || '';
                            if(!is_show || !_data){
                                res.contentType('json');
                                res.send({
                                    code: '-1',
                                    desc: '没有该文章'
                                });
                                return false;
                            }
                            
                            callback(null)
                        })
                    },
                    //【step2】查看评论
                    (callback)=>{
                        BlogComment.findById(object_id, '-_id slug revert')
                        .exec((err, _data)=>{
                            if(err)console.log(err);
                            if(!_data){
                                res.contentType('json');
                                res.send({
                                    code: '-1',
                                    desc: '该文章没有这条评论，请查看评论id传的对不对'
                                });
                                return false;
                            }
                            if(_data.slug != param1){
                                res.contentType('json');
                                res.send({
                                    code: '-1',
                                    desc: '该评论不属于当前文章'
                                });
                                return false;
                            }
                            callback(null, _data )
                        })
                    },
                    //【step3】查看有木有资格删
                    (resData, callback)=>{
                        let revert = resData.revert || {};
                        let _revert = revert[floor];
                        if( !_revert ){
                            res.contentType('json');
                            res.send({
                                code: '-1',
                                desc: '没有该条回复'
                            });
                            return false;
                        }
                        let u_id = _revert.user_id || '';
                        if(u_id != user_id){
                            res.contentType('json');
                            res.send({
                                code: '-1',
                                desc: '该条回复不是你回复的，不能删除'
                            });
                            return false;
                        }
                        delete revert[floor]
                        callback(null, revert)
                    },
                    //【step4】删除回复
                    (revert, callback)=>{
                        BlogComment.update({_id: object_id}, {$set:{revert}})
                        .exec((err)=>{
                            if(err)console.log(err);
                            callback(null )
                        })
                    }
                ], (err)=>{
                    if(err)console.log(err);
                    res.contentType('json');
                    res.send({
                        code: ResCode.success.c,
                        data: {
                            floor
                        },
                        desc: '删除回复'+ResCode.success.d
                    });
                })
                return false;
            }
        }
    }
    res.contentType('json');
    res.send({
        code: ResCode.error.c,
        desc: ResCode.error.d+'不知道你要干啥，兄弟'
    });
    return false;
})



// 4.1用户-关注、取消关注
router.get('/follow/:id', $middlewares, (req, res)=>{
    var pre_user_id = req.params.id || '';//被关注者的id
    var api_user = req.api_user || '';//本人的登录信息
    if( pre_user_id == '' ){//如果id 没传 炜-warning 做不做这个判断其实无所谓 因为如果没有:id 也进不来 会返回404
        res.contentType('json');
        res.send({
            code: '-1',
            desc: '请传入被关注者的id'
        });
        return false;
    }
    //没有登录
    if(typeof api_user === 'string'){
        res.contentType('json');
        res.send({
            code: ResCode.unlogin.c,
            desc: api_user
        });
        return false;
    }


    var { user_id } = api_user || '';//本人id


    async.waterfall([
        //【第一步】findOne 查被关注人的 _id
        (callback)=>{
            BlogUser.findOne({user_id: pre_user_id}, '_id followers')
            .exec((err, _data)=>{
                if(err) console.log(err);
                let resData = _data || '';
                let pre_id = resData._id || '';
                console.log('sdfsf')
                console.log(resData.followers)
                let followers = resData.followers || [];
                
                if(pre_id === ''){
                    res.contentType('json');
                    res.send({
                        code: ResCode.nofound.c,
                        desc: ResCode.nofound.d+'被关注的人'
                    });
                    return false;
                }
                callback(null, pre_id, followers)
            })
        },
        //【第二步】findOne 查自己的关注列表
        (pre_id, followers, callback)=>{
            BlogUser.findOne({user_id}, '_id following')
            .exec((err, _data)=>{
                if(err) console.log(err);
                let resData = _data || '';
                let following = resData.following || [];
                let me_id = resData._id || [];

                let pre_id_index = following.indexOf(pre_id);
                let me_id_index = followers.indexOf(me_id);
                console.log(me_id_index +'----'+ me_id)
                let act = '';
                if(pre_id_index=='-1'){
                    followers.unshift(me_id)
                    following.unshift(pre_id)
                    act = '关注';
                }else{
                    followers.splice(me_id_index, 1)
                    following.splice(pre_id_index, 1)
                    act = '取消';
                }

                callback(null, following, followers, act)
            })
        },
        //【第三步】update 自己的关注列表
        (following, followers, act, callback)=>{
            BlogUser.update({user_id}, {$set:{following}})
            .exec((err)=>{
                if(err) console.log(err);
                callback(null, followers, act)
            })
        },
        //【第四步】update 被关注着的粉丝列表
        (followers, act, callback)=>{
            BlogUser.update({user_id: pre_user_id}, {$set:{followers}})
            .exec((err)=>{
                if(err) console.log(err);
                callback(null, act)
            })
        }
    ], (err, act)=>{
        res.contentType('json');
        res.send({
            code: ResCode.success.c,
            desc: act+ResCode.success.d
        });
        return false;
    })

    
})

// 4.2用户-关注数、文章数...
router.get('/userinfo/:id', $middlewares, (req, res)=>{
    var pre_user_id = req.params.id || '';//将查看的id
    var api_user = req.api_user || '';//本人的登录信息
    if( pre_user_id == '' ){//如果id 没传 炜-warning 做不做这个判断其实无所谓 因为如果没有:id 也进不来 会返回404
        res.contentType('json');
        res.send({
            code: '-1',
            desc: '请传入需要查看的博主id'
        });
        return false;
    }
    
    async.waterfall([
        //【第一步】findOne 查用户信息
        (callback)=>{
            BlogUser.findOne({user_id: pre_user_id}, '_id user_id user_object_id love say likelist collect followers following')
            .populate({
                path:'user_object_id',
                select: '-_id headimg username sex'
            })
            .exec((err, _data)=>{
                if(err)console.log(err);
                
                if(!_data){
                    res.contentType('json');
                    res.send({
                        code: ResCode.nofound.c,
                        desc: ResCode.nofound.d+'用户信息'
                    });
                    return false;
                }
                let pre_id = _data._id || '';
                let user_object_id = _data.user_object_id || '';
                let param = {
                    userid: _data.user_id || '',
                    headimg: user_object_id.headimg || '',
                    name: user_object_id.username || '',
                    following: _data.following.length || 0,
                    followers: _data.followers.length || 0,
                    love: _data.love || 0,
                    sex: user_object_id.sex || '',
                    say: _data.say || '',
                    is_me: false
                }
                callback(null, param, pre_id)
            })
        },
        //【第二步】findOne 查用户发布的文章数
        (param, pre_id, callback)=>{
            BlogArticle.find({user_id: param.userid, is_show: true}, '_id')
            .exec((err, _data)=>{
                if(err)console.log(err);
                if(!_data){
                    res.contentType('json');
                    res.send({
                        code: ResCode.nofound.c,
                        desc: ResCode.nofound.d+'用户文章数'
                    });
                    return false;
                }
                param.articlenum = _data.length
                callback(null, param, pre_id)
            })
        },
        //【第三步】findOne 查是否被自己关注过
        (param, pre_id, callback)=>{
            //没有登录
            if(typeof api_user === 'string'){
                param.is_follow = false;//没有关注
                callback(null, param)
            }else{
                let {user_id} = api_user || '';

                if(user_id == pre_user_id){
                    param.is_me = true;//没有关注
                    callback(null, param)
                }else{
                    BlogUser.findOne({user_id}, '-_id following')
                    .exec((err, _data)=>{
                        if(err)console.log(err);
                        
                        if(!_data){//差不到自己信息的时候 当做他没有关注
                            param.is_follow = false;//没有关注
                            callback(null, param)
                        }
                        let following = _data.following || '';
                        
                        param.is_follow = following.indexOf(pre_id)>=0?true: false; 
                        callback(null, param)
                    })
                }
            }
        },
        //updata 更新用户的文章数
        (param, callback)=>{
            BlogUser.update({user_id:pre_user_id}, {$set:{articlenum: param.articlenum}})
            .exec((err)=>{
                if(err)console.log(err);
                callback(null, param)
            })
        }
    ], (err, param)=>{
        res.contentType('json');
        res.send({
            code: ResCode.success.c,
            data: param,
            desc: ResCode.success.d
        });
        return false;
    })
    
})
// 4.3用户-关注、粉丝列表 炜-warning 没有考虑分页
router.post('/followlist', $middlewares, (req, res)=>{
    var pre_user_id = req.body.id || '';//将查看的id
    var act = req.body.act || '';//1关注 2粉丝
    var api_user = req.api_user || '';//本人的登录信息
    if( pre_user_id == '' || act == ''){//如果id或者act 没传 
        res.contentType('json');
        res.send({
            code: '-1',
            desc: '请传入需要查看的博主id和操作标识'
        });
        return false;
    }
    let is_me = ''//0 未登录 1已登录不是看自己 2已登录查看自己
    if(typeof api_user === 'string'){
        is_me = '0';
    }else if( api_user.user_id == pre_user_id ){
        is_me = '2'
    }else{
        is_me = '1'
    }
    let findOne = function* (){

        yield BlogUser.findOne({user_id: api_user.user_id}, '_id')

    }
    let recombination = (item, id)=>{//重组参数
        let ui = item.user_object_id || '';
        let following = item.following || [];
        let followers = item.followers || [];
        let is_follow = false;
        
        //act 1关注 2粉丝
        //is_me 0 未登录 1已登录不是看自己 2已登录查看自己
        if(act == '1'){//关注
            if(is_me == '2'){//自己
                is_follow = true;
            }else if( is_me == '1' ){
                is_follow = followers.indexOf(id)>=0? true: false;
            }
        }else {//粉丝
            if( is_me != '0' ){
                is_follow = followers.indexOf(id)>=0? true: false;
            }
        }
        return {
            userid: item.user_id || '',
            headimg: ui.headimg || '',
            name: ui.username || '',
            following: following.length,
            followers: followers.length,
            articlenum: item.articlenum,
            love: item.love,
            is_follow,
            sex: ui.sex || ''
        }
    }
    async.waterfall([
        //【第一步】查用户关注 粉丝列表
        (callback)=>{
            BlogUser.findOne({user_id:pre_user_id}, '-_id followers following')
            .populate({
                path: 'followers following',
                select: '-_id user_id following followers articlenum love user_object_id',
                populate: {
                    path: 'user_object_id',
                    modal: 'user',
                    select: '-_id headimg username sex'
                }
            })
            
            .exec((err, _data)=>{
                if(err)console.log(err);

                if(!_data){
                    res.contentType('json');
                    res.send({
                        code: ResCode.nofound.c,
                        desc: ResCode.nofound.d+'用户信息'
                    });
                    return false;
                }
                let resData = _data || '';
                
                if(act == '1'){//关注
                    resData = resData.following || [];
                }else if(act == '2'){//粉丝
                    resData = resData.followers || [];
                }else{
                    res.contentType('json');
                    res.send({
                        code: '-1',
                        desc: '兄弟，没有act为'+act+'的'
                    });
                    return false;
                }
               

                callback(null, resData);
            })
        },
        //【setp 2】 看看自己有木有关注
        (resData, callback)=>{
            if(is_me == '0'){//未登录
                let _resData = resData.map(item=>{
                    return recombination(item)
                })
                callback(null, _resData)
            }else{
                let fo = findOne();
                fo.next().value
                .exec((err, _data)=>{
                    if(err)console.log(err);
                    if(!_data){//没有查到登录人的blog表信息 系统当它没有登录
                        let _resData = resData.map(item=>{
                            return recombination(item)
                        })
                        callback(null, _resData)
                        return false
                    }
                    let _id = _data._id || '';//当前登录用户的blog表 _id
                    _id = _id+''
                    let _resData = resData.map(item=>{
                        return recombination(item, _id)
                    })
                    callback(null, _resData)
                })
            }
        }
    ], (err, _resData)=>{
        res.contentType('json');
        res.send({
            code: ResCode.success.c,
            data: _resData,
            desc: ResCode.success.d
        });
        return false;
    })
})



/*
炜-warning 没有考虑分页
 4.4 {get} 文章列表             /user_article/:id
 4.5 {get} 喜欢的文章列表        /user_article/:id/love
 4.6 {get} 热门的文章列表        /user_article/:id/hot
 4.7 {get} 收藏的文章列表        /user_article/collect
 */
router.all(/^\/user_article(\/\w+)?(\/\w+)?$/, $middlewares, (req, res)=>{
    method = req.method || '',//请求方式
    param1 = req.params[0] || '',//参数1
    param2 = req.params[1] || '';//参数2
    param1 = param1.substr(1);
    param2 = param2.substr(1);

    if(!/^get$/i.test(method)){
        res.contentType('json');
        res.send({
            code: ResCode.error.c,
            desc: ResCode.error.d+'该接口只支持get请求方式'
        });
        return false;
    }
    if( param1 != '' && param2 == ''){
        if(param1 == 'collect'){//4.7
            var api_user = req.api_user || '';//本人的登录信息
            if(typeof api_user == 'string'){
                res.contentType('json');
                res.send({
                    code: ResCode.nofound.c,
                    desc: api_user
                });
                return false;
            }
            let user_id = api_user.user_id || '';
            BlogUser.findOne({user_id}, '-_id collect')
            .populate({
                path: 'collect',
                model: 'BlogArticle',
                select: '-_id user_object_id slug user_id createAt read comment lovenum title body img_url',
                populate: {
                    path: 'user_object_id',
                    model: 'user',
                    select: '-_id headimg username'
                }
            })
            .exec((err, _data)=>{
                if(err)console.log(err);
        
                if(!_data){
                    res.contentType('json');
                    res.send({
                        code: ResCode.nofound.c,
                        desc: ResCode.nofound.d+'用户信息'
                    });
                    return false;
                }
                let collect = _data.collect || [];
                let resData = collect.map((item)=>{
                    let body = item.body || '',
                    intro = body.substr(0, 20),
                    comment = item.comment || [],
                    love = item.lovenum || 0,
                    user_object_id = item.user_object_id || '';
        
                    return {
                        slug: item.slug || '',
                        userid: item.user_id || '',
                        headimg: user_object_id.headimg || '',
                        name: user_object_id.username || '',
                        cdate: item.createAt || '',
                        title: item.title || '',
                        intro,
                        read: item.read || 0,
                        comment: comment.length,
                        love,
                        img_url: item.img_url || ''
                    }
                })
        
                res.contentType('json');
                res.send({
                    code: ResCode.success.c,
                    data: resData,
                    desc: ResCode.success.d
                });
            })
            return false;
        }else{//4.4
            BlogArticle.find({user_id: param1, is_show: true}, '-_id user_object_id slug user_id createAt read comment lovenum title body img_url')
            .populate({
                path: 'user_object_id',
                select: '-_id headimg username sex',
                model: 'user'
            })
            .exec((err, _data)=>{
                if(err)console.log(err);
                if(!_data){
                    res.contentType('json');
                    res.send({
                        code: ResCode.nofound.c,
                        desc: ResCode.nofound.d+'用户文章'
                    });
                    return false;
                }
                let resData = _data.map((item)=>{
                    let body = item.body || '',
                    intro = body.substr(0, 20),
                    comment = item.comment || 0,
                    love = item.lovenum || 0,
                    user_object_id = item.user_object_id || '';
    
                    return {
                        slug: item.slug || '',
                        userid: item.user_id || '',
                        headimg: user_object_id.headimg || '',
                        name: user_object_id.username || '',
                        cdate: item.createAt || '',
                        title: item.title || '',
                        intro,
                        read: item.read || 0,
                        comment: comment,
                        love,
                        img_url: item.img_url || ''
                    }
                })
    
                res.contentType('json');
                res.send({
                    code: ResCode.success.c,
                    data: resData,
                    desc: '查询文章列表'+ResCode.success.d
                });
                return false;
    
            })
            return false;
        }
    }else if( param1 != '' && param2 != ''){
        if(param2 == 'love'){//4.5
            BlogUser.findOne({user_id: param1}, '-_id likelist')
            .populate({
                path: 'likelist',
                model: 'BlogArticle',
                select: '-_id user_object_id slug user_id createAt read comment love title body img_url',
                populate: {
                    path: 'user_object_id',
                    model: 'user',
                    select: '-_id headimg username'
                }
            })
            .exec((err, _data)=>{
                if(err)console.log(err);
                if(!_data){
                    res.contentType('json');
                    res.send({
                        code: ResCode.nofound.c,
                        desc: ResCode.nofound.d+'用户信息'
                    });
                    return false;
                }
                let likelist = _data.likelist || [];
                let resData = likelist.map((item)=>{
                    let body = item.body || '',
                    intro = body.substr(0, 20),
                    comment = item.comment || 0,
                    love = item.love || [],
                    user_object_id = item.user_object_id || '';
    
                    return {
                        slug: item.slug || '',
                        userid: item.user_id || '',
                        headimg: user_object_id.headimg || '',
                        name: user_object_id.username || '',
                        cdate: item.createAt || '',
                        title: item.title || '',
                        intro,
                        read: item.read || 0,
                        comment: comment,
                        love: love.length,
                        img_url: item.img_url || ''
                    }
                })
    
                res.contentType('json');
                res.send({
                    code: ResCode.success.c,
                    data: resData,
                    desc: '查询喜欢的文章'+ResCode.success.d
                });
                return false;
            })

            return false;
        }
        if(param2 == 'hot'){//4.6
            BlogArticle.find({user_id: param1, is_show: true}, '-_id user_object_id slug user_id createAt read comment lovenum title body img_url')
            .sort({lovenum: -1})
            .populate({
                path: 'user_object_id',
                select: '-_id headimg username sex',
                model: 'user'
            })
            .exec((err, _data)=>{
                if(err)console.log(err);
                if(!_data){
                    res.contentType('json');
                    res.send({
                        code: ResCode.nofound.c,
                        desc: ResCode.nofound.d+'用户文章'
                    });
                    return false;
                }
                let resData = _data.map((item)=>{
                    let body = item.body || '',
                    intro = body.substr(0, 20),
                    comment = item.comment || 0,
                    love = item.lovenum || 0,
                    user_object_id = item.user_object_id || '';
    
                    return {
                        slug: item.slug || '',
                        userid: item.user_id || '',
                        headimg: user_object_id.headimg || '',
                        name: user_object_id.username || '',
                        cdate: item.createAt || '',
                        title: item.title || '',
                        intro,
                        read: item.read || 0,
                        comment: comment,
                        love,
                        img_url: item.img_url || ''
                    }
                })
    
                res.contentType('json');
                res.send({
                    code: ResCode.success.c,
                    data: resData,
                    desc: '查询文章列表'+ResCode.success.d
                });
                return false;
    
            })
            return false;
        }
    }




    res.contentType('json');
    res.send({
        code: ResCode.error.c,
        desc: ResCode.error.d+'不知道你要干啥，兄弟'
    });
    return false;

})



// 4.8用户-编辑个人介绍
router.post('/user_say', $middlewares, (req, res)=>{
    var say = req.body.say || '';//
    var api_user = req.api_user || '';//本人的登录信息

    if(typeof api_user == 'string'){
        res.contentType('json');
        res.send({
            code: ResCode.nofound.c,
            desc: api_user
        });
        return false;
    }
    let user_id = api_user.user_id || '';
    BlogUser.findOneAndUpdate({user_id}, {$set:{say}},{new: true})
    .exec((err, _data)=>{
        if(err)console.log(err);
        let resData = _data || '';
        let _say = resData.say || '';
        res.contentType('json');
        res.send({
            code: ResCode.success.c,
            data: {
                say: _say
            },
            desc: ResCode.success.d+'更新'
        });
        return false;
    })
})



/*
文集
Method 只支持 { post put get }
5.1 新增文集 {post}    /data/blog/notebooks
5.2 删除文集 {post}    /data/blog/notebooks/:id/soft_destroy
5.3 修改文集名 {put}   /data/blog/notebooks/:id
5.4 查询文集列表 {get}  /data/blog/notebooks
5.5 排序文集 {post}    /data/blog/notebooks/update_seq

/^\/note\/notebooks(\/\w+)?(\/\w+)?$/
/^\/note\/(?:notebooks|notebooks\/\w+|notebooks\/\w+\/\w+)$/
*/

router.all(/^\/notebooks(\/\w+)?(\/\w+)?$/, $middlewares, (req, res)=>{
        var api_user = req.api_user || '',//本人的登录信息
        method = req.method || '',//请求方式
        param1 = req.params[0] || '',//参数1
        param2 = req.params[1] || '';//参数2
        param1 = param1.substr(1);
        param2 = param2.substr(1);
        if(typeof api_user == 'string'){//未登录的直接过滤掉
            res.contentType('json');
            res.send({
                code: ResCode.nofound.c,
                desc: api_user
            });
            return false;
        }

        var user_id = api_user.user_id || '';//用户id

        if( param1 == param2 && param1 == '' ){
            if( /^post$/i.test(method) ){//5.1
                let {seq, name} = req.body || '';

                Increment.findOneAndUpdate({"type":"noteid"},{$inc:{id:1}},{new: true}, (err, noteInc)=>{
                    if(err)return false;

                    let note_id = noteInc.id;


                    BlogNote.create({ user_id, id: note_id, name, seq }, function (err, _data) {
                        if (err) return console.log(err);// 炜-warning 这里可以写个公用的方法 

                        res.contentType('json');
                        res.send({
                            code: ResCode.success.c,
                            data: _data,
                            desc: ResCode.success.d
                        });
                        return false;
                    })
                    return false;
                })
                return false;
            }else if( /^get$/i.test(method) ){//5.4
                BlogNote.find({user_id})
                .exec((err, _data)=>{
                    if(err)console.log(err);
                    if(!_data){
                        res.contentType('json');
                        res.send({
                            code: ResCode.nofound.c,
                            desc: ResCode.nofound.d+'文集'
                        });
                        return false;
                    }
                    res.contentType('json');
                    res.send({
                        code: ResCode.success.c,
                        data: _data,
                        desc: ResCode.success.d
                    });
                })
                return false;
            }
        }else if( param1 != '' && param2 == '' ){
            if( /^put$/i.test(method) ){//5.3
                let name = req.body.name || '';
                BlogNote.findOne({id: param1})
                .exec((err, _data)=>{
                    if(err)console.log(err);

                    if(!_data){
                        res.contentType('json');
                        res.send({
                            code: ResCode.nofound.c,
                            desc: ResCode.nofound.d+'该文集'
                        });
                        return false;
                    }

                    let u_id = _data.user_id || '';
                    if( u_id != user_id ){
                        res.contentType('json');
                        res.send({
                            code: '-1',
                            desc: '该文集不是您的，你不能修改文集名'
                        });
                        return false;
                    }
                    BlogNote.update({id: param1}, {$set: {name}})
                    .exec((err)=>{
                        if(err)console.log(err);
                        res.contentType('json');
                        res.send({
                            code: ResCode.success.c,
                            desc: ResCode.success.d
                        });
                        return false;
                    })
                })
                return false;
            }else if( /^post$/i.test(method) ){
                if( param1 == 'update_seq' ){//5.5
                    



                }
            }
        }else if( param1 != '' && param2 != '' ){
            if( /^post$/i.test(method) ){
                if( param2 == 'soft_destroy' ){//5.2
                    

                    async.waterfall([
                        //【step1】排除错误情况
                        (callback)=>{
                            BlogNote.findOne({id: param1}, '-_id user_id')
                            .exec((err, _data)=>{
                                if(err)console.log(err);
                                if(!_data){
                                    res.contentType('json');
                                    res.send({
                                        code: ResCode.nofound.c,
                                        desc: ResCode.nofound.d+'该文集'
                                    });
                                    return false;
                                }
                                let u_id = _data.user_id || '';
                                if( u_id != user_id ){
                                    res.contentType('json');
                                    res.send({
                                        code: '-1',
                                        desc: '该文集不是您的，你不能删除'
                                    });
                                    return false;
                                }
                                callback(null)
                            })
                        },
                        //【step2】删除文集
                        (callback)=>{
                            BlogNote.update({id: param1, user_id}, {$set: {is_show: false}})
                            .exec((err)=>{
                                if(err)console.log(err);
                                callback(null)
                            })
                        },
                        //【step3】删除文集下面所有文章
                        (callback)=>{
                            BlogNoteArticle.update({note_id: param1, user_id}, {$set:{is_show: false, deleteAt: Date.now()}}, {multi: true})
                            .exec((err)=>{
                                if(err)console.log(err);
                                callback(null)
                            })
                        },
                        //【step4】删除文集下面所有已发布的文章
                        (callback)=>{
                            BlogArticle.update({note_id: param1, user_id}, {$set:{is_show: false}}, {multi: true})
                            .exec((err)=>{
                                if(err)console.log(err);
                                callback(null)
                            })
                        }
                    ], (err)=>{
                        res.contentType('json');
                        res.send({
                            code: ResCode.success.c,
                            data:{
                                id: param1
                            },
                            desc: ResCode.success.d
                        });
                    })
                    return false;
                }
            }
        }

        res.contentType('json');
        res.send({
            code: '-1',
            desc: '不知道你要干啥，兄弟'
        });
        return false;
})



/*
文章
Method 只支持 { post put get delete }
6.1 新增文章   {post}  /data/blog/notes
6.2 删除文章   {post}  /data/blog/notes/:id/soft_destroy
6.3 排序文章   {post}  /data/blog/notes/update_seq
6.4 查询文章列表 {get}  /data/blog/notes
6.5 保存文章    {put}   /data/blog/notes/:id
6.6 发布文章    {post}  /data/blog/notes/:id/publicize
6.7 设为私有    {post}  /data/blog/notes/:id/privatize
6.8 文章内容     {get}  /data/blog/notes/:id/content
7.1 销毁文章   {DELETE} /data/blog/notes/:id
7.2 恢复删除文章 {post}  /data/blog/notes/:id/put_back
8.1 设置大标签   {post} /data/blog/notes/:id/tag
8.2 设置小标签   {post}  /data/blog/notes/:id/tag_item
*/
router.all(/^\/notes(\/\w+)?(\/\w+)?$/, $middlewares, (req, res)=>{
    var api_user = req.api_user || '',//本人的登录信息
    method = req.method || '',//请求方式
    param1 = req.params[0] || '',//参数1
    param2 = req.params[1] || '';//参数2
    param1 = param1.substr(1);
    param2 = param2.substr(1);
    if(typeof api_user == 'string'){//未登录的直接过滤掉
        res.contentType('json');
        res.send({
            code: ResCode.nofound.c,
            desc: api_user
        });
        return false;
    }

    var user_id = api_user.user_id || '';//用户id

    if( param1 == param2 && param1 == '' ){
        if( /^post$/i.test(method) ){//6.1
            let { note_id, seq_in_nb, title } = req.body || '';
            if( !note_id || !seq_in_nb || !title ){
                res.contentType('json');
                res.send({
                    code: '-1',
                    desc: '新增文章需要文集id，序号，文章标题'
                });
                return false;
            }
            if( !/^-?\d+$/.test(seq_in_nb) ){
                res.contentType('json');
                res.send({
                    code: '-1',
                    desc: '请传入数字序号'
                });
                return false;
            }
            async.waterfall([
                //【第一步】过滤错误的情况
                (callback)=>{
                    BlogNote.findOne({id: note_id}, '-_id user_id')
                    .exec((err, _data)=>{
                        if(err)console.log(err);
                        if(!_data){
                            res.contentType('json');
                            res.send({
                                code: ResCode.nofound.c,
                                desc: ResCode.nofound.d+'文集'
                            });
                            return false;
                        }
                        let u_id = _data.user_id || '';
                        if( u_id != user_id ){
                            res.contentType('json');
                            res.send({
                                code: '-1',
                                desc: '该文集不是您的，你不能在里面添加文章'
                            });
                            return false;
                        }
                        callback(null)
                    })
                },
                //【第二步】获取 文章id
                (callback)=>{
                    Increment.findOneAndUpdate({"type":"articleid"},{$inc:{id:1}},{new: true}, (err, articleInc)=>{
                        if(err)console.log(err);
                        let article_id = articleInc.id;

                        Increment.findOneAndUpdate({"type":"push_articleid"},{$inc:{id:1}},{new: true}, (err, push_articleInc)=>{
                            if(err)console.log(err);
                            let slug = push_articleInc.id;
                            callback(null, article_id, slug)
                        })
                    })
                },
                //【第三步】插入文章
                (id, slug, callback)=>{
                    BlogNoteArticle.create({ user_id, id, slug, note_id, title, body:'', note_type:'markdown', tag_item:'', seq_in_nb  }, function (err, _data) {
                        if (err) return console.log(err);// 炜-warning 这里可以写个公用的方法 
                        callback(null, _data )
                    })
                }
            ], (err, result)=>{
                res.contentType('json');
                res.send({
                    code: ResCode.success.c,
                    data: result,
                    desc: ResCode.success.d
                });
            })
            return false;
        }else if( /^get$/i.test(method) ){//6.4
            BlogNoteArticle.find({user_id}, '-_id -history')
            .sort({seq_in_nb: 1})
            .exec((err, _data)=>{
                if(err)console.log(err);
                if(!_data){
                    res.contentType('json');
                    res.send({
                        code: ResCode.nofound.c,
                        desc: ResCode.nofound.d+'文集列表'
                    });
                    return false;
                }
                let resData = _data,
                body = (_data.body || '').substr(0, 20);
                resData.body = body;

                res.contentType('json');
                res.send({
                    code: ResCode.success.c,
                    data: resData,
                    desc: ResCode.success.d
                });
            })
            return false;
        }
    }else if( param1 != '' && param2 == '' ){
        if( /^post$/i.test(method) ){
            if( param1 == 'update_seq' ){//6.3

            }
        }else if( /^put$/i.test(method) ){//6.5
            // param1//文章id
            let { title, content, note_type } = req.body || '';
            note_type = note_type || 'markdown';
            async.waterfall([
                //【第一步】 查文章信息
                (callback)=>{
                    BlogNoteArticle.findOne({id: param1}, '-_id user_id is_show type')
                    .exec((err, _data)=>{
                        if(err)console.log(err);
                        if(!_data){
                            res.contentType('json');
                            res.send({
                                code: ResCode.nofound.c,
                                desc: ResCode.nofound.d+'文章'
                            });
                            return false;
                        }
                        let u_id = _data.user_id || '',
                        is_show = _data.is_show,
                        type = _data.type || '';
                        if( u_id != user_id ){
                            res.contentType('json');
                            res.send({
                                code: '-1',
                                desc: '该文章不是你的，你不能保存'
                            });
                            return false;
                        }
                        if(!is_show){
                            res.contentType('json');
                            res.send({
                                code: '-1',
                                desc: '请不要试图保存一个已经被删除的文章'
                            });
                            return false;
                        }
                        callback(null, type)
                    })
                },
                //【第二步】保存文章
                (type, callback)=>{
                    if(type == '2')//已发布的 要改成发布更新
                    type = type == '2'?'3':type;
                    BlogNoteArticle.findOneAndUpdate({id: param1}, {$set: {title, body: content, note_type, type }}, { new: true })
                    .exec((err, _data)=>{
                        if(err)console.log(err);
                        if(!_data){
                            res.contentType('json');
                            res.send({
                                code: '-1',
                                desc: '更新文章失败'
                            });
                            return false;
                        }
                        callback(null, _data)
                    })
                }
            ], (err, result)=>{
                res.contentType('json');
                res.send({
                    code: ResCode.success.c,
                    data: result,
                    desc: ResCode.success.d
                });
            })
            return false;
        }else if( /^delete$/i.test(method) ){//7.1
            async.waterfall([
                //【step1】错误排除
                (callback)=>{
                    BlogNoteArticle.findOne({id: param1}, '-_id is_show note_id user_id slug')
                    .exec((err, _data)=>{
                        if(err)console.log(err);
                        if(!_data){
                            res.contentType('json');
                            res.send({
                                code: ResCode.nofound.c,
                                desc: ResCode.nofound.d+'当前文章',
                            });
                            return false;
                        }
                        let {user_id: u_id, is_show, note_id, slug} = _data||'';
                        if(u_id != user_id){
                            res.contentType('json');
                            res.send({
                                code: '-1',
                                desc: '瞎几把搞，这不是你的文章 不能销毁',
                            });
                            return false;
                        }
                        if(is_show){
                            res.contentType('json');
                            res.send({
                                code: '-1',
                                desc: '只能销毁被删除的文章',
                            });
                            return false;
                        }
                        callback(null, note_id, slug)
                    })
                },
                //【step2】查看文集信息
                ( note_id, slug, callback)=>{
                    BlogNote.findOne({id: note_id}, '-_id is_show')
                    .exec((err, _data)=>{
                        if(err)console.log(err);
                        if(!_data){
                            res.contentType('json');
                            res.send({
                                code: ResCode.nofound.c,
                                desc: ResCode.nofound.d+'当前文章所属的文集',
                            });
                            return false;
                        }
                        callback(null, _data, note_id, slug)
                    })
                },
                //【step3】 如果文集被删除了 查看下面是否只有这一篇文章 如果只有这一篇同时删除文集
                (resData, note_id, slug, callback)=>{
                    if(!resData.is_show){//文集也被删除
                        BlogNoteArticle.find({note_id, user_id})
                        .exec((err, _data)=>{
                            if(err)console.log(err);
                            if(_data.length == '1'){
                                //删除文集
                                BlogNote.remove({id:note_id, user_id}, function(err){
                                    if(err) console.log(err);
                                    callback(null, slug)
                                })
                            }else{
                                callback(null, slug)
                            }
                        })
                    }else{
                        callback(null, slug)
                    }
                },
                //【step4】删除文章 如果这篇文章曾今发布过 同时删除已发布的文章
                (slug, callback)=>{
                    BlogArticle.remove({user_id, slug}, (err)=>{
                        if(err) console.log(err);
                        BlogNoteArticle.remove({user_id, id: param1}, (err)=>{
                            if(err) console.log(err);
                            callback(null)
                        })
                    })
                }
            ], (err)=>{
                if(err)console.log(err);
                res.contentType('json');
                res.send({
                    code: ResCode.success.c,
                    data:{
                        id: param1
                    },
                    desc: '删除'+ResCode.success.d
                });
            })
            return false;
        }
    }else if( param1 != '' && param2 != '' ){
        if( /^post$/i.test(method) ){
            if( param2 == 'soft_destroy' ){//6.2

                async.waterfall([
                    //【第一步】过滤错误的情况
                    (callback)=>{
                        BlogNoteArticle.findOne({id: param1}, '-_id user_id is_show type')
                        .exec((err, _data)=>{
                            if(err)console.log(err);
                            if(!_data){
                                res.contentType('json');
                                res.send({
                                    code: ResCode.nofound.c,
                                    desc: ResCode.nofound.d+'文章'
                                });
                                return false;
                            }
                            let u_id = _data.user_id || '',
                            is_show = _data.is_show,
                            type = _data.type || '';
                            if( u_id != user_id ){
                                res.contentType('json');
                                res.send({
                                    code: '-1',
                                    desc: '该文章不是你的，你不能删除'
                                });
                                return false;
                            }
                            if(!is_show){
                                res.contentType('json');
                                res.send({
                                    code: '-1',
                                    desc: '请不要重复删除'
                                });
                                return false;
                            }
                            callback(null, type)
                        })
                    },
                    //【第二步】隐藏该文章
                    (type, callback)=>{
                        let presentTime = Date.now();
                        BlogNoteArticle.findOneAndUpdate({ user_id, id: param1 }, {$set: {is_show:false, deleteAt: presentTime}}, {new: true})
                        .exec((err, _data)=>{
                            if(err)console.log(err);
                            if(!_data){
                                res.contentType('json');
                                res.send({
                                    code: ResCode.error.c,
                                    desc: ResCode.error.d
                                });
                            }
                            let slug = _data.slug || '';
                            callback(null, presentTime, type, slug)
                        })
                    },
                    //【第三步】如果该文章已发布 取消发布
                    (presentTime, type, slug, callback)=>{
                        if(type == '2' || type == '3'){
                            BlogArticle.update({slug, user_id}, {$set:{is_show: false}})
                            .exec((err)=>{
                                if(err)console.log(err);
                                callback(null, presentTime)
                            })
                        }else{
                            callback(null, presentTime)
                        }
                    }
                ], (err, presentTime)=>{
                    res.contentType('json');
                    res.send({
                        code: ResCode.success.c,
                        data: {
                            param1,
                            deleteAt: presentTime
                        },
                        desc: ResCode.success.d
                    });
                })
                return false;
            }else if( param2 == 'publicize' ){//6.6
                async.waterfall([
                    //【第一步】过滤错误的情况
                    (callback)=>{
                        BlogNoteArticle.findOne({id: param1})
                        .exec((err, _data)=>{
                            if(err)console.log(err);
                            if(!_data){
                                res.contentType('json');
                                res.send({
                                    code: ResCode.nofound.c,
                                    desc: ResCode.nofound.d+'文章'
                                });
                                return false;
                            }
                            let u_id = _data.user_id || '',
                            is_show = _data.is_show;
                            if( u_id != user_id ){
                                res.contentType('json');
                                res.send({
                                    code: '-1',
                                    desc: '该文章不是你的，你不能发布'
                                });
                                return false;
                            }
                            if(!is_show){
                                res.contentType('json');
                                res.send({
                                    code: '-1',
                                    desc: '不能对已删除的文章做发布操作'
                                });
                                return false;
                            }
                            callback(null, _data)
                        })
                    },
                    //【第二步】查看是否是第一次发布
                    (noteInfo, callback)=>{
                        let { slug } = noteInfo || '';
                        BlogArticle.findOne({slug: slug})
                        .exec((err, _data)=>{
                            if(err)console.log(err);
                            callback(null, _data, noteInfo )
                        })
                    },
                    //【第三步】 更新发布 或者 发布
                    (resData, noteInfo, callback)=>{
                        let { slug, note_id, id, title, body, tag, tag_item, type  } = noteInfo || '';
                        // user_object_id
                        if(!resData){//发布
                            let _blogArticle = new BlogArticle({ user_id, user_object_id: api_user._id, slug, note_id, article_id: id, img_url:'', title, body, love:[], tag, tag_item, is_show: true, comment:''})
                            _blogArticle.save((err)=>{ 
                                if (err) return console.log(err);// 炜-warning 这里可以写个公用的方法 
                                callback(null, '发布')
                            })
                        }else{//更新发布
                            BlogArticle.findOneAndUpdate({ slug }, {$set: {title, body, tag, tag_item, is_show: true}}, {new: true})
                            .exec((err, _data)=>{
                                if (err) return console.log(err);
                                callback(null, '更新发布')
                            })
                        }
                    },
                    (act, callback)=>{
                        BlogNoteArticle.update({id: param1}, {$set:{ type: 2}})
                        .exec((err)=>{
                            if(err)console.log(err);

                            callback(null, act)
                        })
                    }
                ], (err, act)=>{
                    res.contentType('json');
                    res.send({
                        code: ResCode.success.c,
                        desc: act+ResCode.success.d
                    });
                })
                return false;
            }else if( param2 == 'privatize' ){//6.7
                
                async.waterfall([
                    //【step1】查询文章信息
                    (callback)=>{
                        BlogNoteArticle.findOne({id:param1}, '-_id user_id slug is_show type ')
                        .exec((err, _data)=>{
                            if(err)console.log(err);
                            if(!_data){
                                res.contentType('json');
                                res.send({
                                    code: ResCode.nofound.c,
                                    desc: ResCode.nofound.d+'文章信息'
                                });
                                return false;
                            }
                            callback(null, _data)
                            
                        })

                    },
                    //【step2】过滤掉错误的情况
                    (resData, callback)=>{
                        let {user_id: u_id, slug, is_show, type} = resData || '';
                        if(u_id!=user_id){
                            res.contentType('json');
                            res.send({
                                code: '-1',
                                desc: '这不是你的文章，你仿佛在搞笑'
                            });
                            return false;
                        }
                        if(!is_show){
                            res.contentType('json');
                            res.send({
                                code: '-1',
                                desc: '已经被删除的文章不能改为私有'
                            });
                            return false;
                        }
                        if(type == '1'){
                            res.contentType('json');
                            res.send({
                                code: '-1',
                                desc: '原本就是私有的，朋友，不要重复提交'
                            });
                            return false;
                        }
                        callback(null, slug)
                    },
                    //【step3】修改文章 is_show type
                    (slug, callback)=>{
                        BlogNoteArticle.update({id:param1}, {$set:{type: 1}})
                        .exec((err)=>{
                            if(err)console.log(err);
                            BlogArticle.update({slug}, {$set:{is_show: false}})
                            .exec((err)=>{
                                if(err)console.log(err);
                                callback(null)
                            })
                        })
                    }
                ], (err, result)=>{
                    res.contentType('json');
                    res.send({
                        code: ResCode.success.c,
                        data:{
                            id: param1,
                            type: 1
                        },
                        desc: ResCode.success.d
                    });
                })
                return false;
            }else if( param2 == 'put_back' ){//7.2
                async.waterfall([
                    //【step1】排除错误情况
                    (callback)=>{
                        BlogNoteArticle.findOne({id: param1}, '-_id is_show note_id user_id slug')
                        .exec((err, _data)=>{
                            if(err)console.log(err);
                            if(!_data){
                                res.contentType('json');
                                res.send({
                                    code: ResCode.nofound.c,
                                    desc: ResCode.nofound.d+'当前文章',
                                });
                                return false;
                            }
                            let {user_id: u_id, is_show, note_id, slug} = _data||'';
                            if(u_id != user_id){
                                res.contentType('json');
                                res.send({
                                    code: '-1',
                                    desc: '瞎几把搞，这不是你的文章 不能恢复',
                                });
                                return false;
                            }
                            if(is_show){
                                res.contentType('json');
                                res.send({
                                    code: '-1',
                                    desc: '只能恢复被删除的文章',
                                });
                                return false;
                            }
                            callback(null, note_id, slug)
                        })
                    },
                    //【step2】恢复文集
                    (note_id, slug, callback)=>{
                        BlogNote.update({id:note_id, user_id}, {$set:{is_show: true}})
                        .exec((err)=>{
                            if(err)console.log(err);
                            callback(null, note_id, slug)
                        })
                    },
                    //【step3】查看有木有对应发布的文章 如果有也恢复
                    (note_id, slug, callback)=>{
                        BlogArticle.update({slug, user_id}, {$set:{is_show: true}})
                        .exec((err)=>{
                            if(err)console.log(err);
                            callback(null, note_id)
                        })
                    },
                    //【step4】恢复文章
                    (note_id, callback)=>{
                        BlogNoteArticle.update({id: param1}, {$set:{is_show: true}})
                        .exec((err)=>{
                            if(err)console.log(err);
                            callback(null, note_id)
                        })
                    }
                ], (err, note_id)=>{
                    if(err)console.log(err);
                    res.contentType('json');
                    res.send({
                        code: ResCode.success.c,
                        data: {
                            id: param1,
                            note_id,
                            is_show: true
                        },
                        desc: '文章恢复'+ResCode.success.d
                    });
                })
                return false;
            }else if(param2 == 'tag'){//8.1
                let tag_id = req.body.tag || '';
                if(!tag_id){
                    res.contentType('json');
                    res.send({
                        code: '-1',
                        desc: '栏目id没传'
                    });
                    return false;
                }


                async.waterfall([
                    //【step1】排除错误情况
                    (callback)=>{
                        BlogNoteArticle.findOne({id: param1}, '-_id is_show user_id type tag')
                        .exec((err, _data)=>{
                            if(err)console.log(err);
                            if(!_data){
                                res.contentType('json');
                                res.send({
                                    code: ResCode.nofound.c,
                                    desc: ResCode.nofound.d+'当前文章'
                                });
                                return false;
                            }
                            let {user_id: u_id, is_show, type, tag} = _data||'';
                            if(u_id != user_id){
                                res.contentType('json');
                                res.send({
                                    code: '-1',
                                    desc: '瞎几把搞，这不是你的文章 不能帮他设置标签'
                                });
                                return false;
                            }
                            if(!is_show){
                                res.contentType('json');
                                res.send({
                                    code: '-1',
                                    desc: '当前文章已经被删除了 不能设置'
                                });
                                return false;
                            }
                            if(tag == tag_id){
                                res.contentType('json');
                                res.send({
                                    code: '-1',
                                    desc: '不要重复提交，你当前已经是这个标签'
                                });
                                return false;
                            }
                            callback(null, type)
                        })
                    },
                    //【step2】获取标签列表
                    (type, callback)=>{
                        BlogTag.find({}, '-_id id')
                        .exec((err, _data)=>{
                            if(err)console.log(err);
                            let resData = _data || [];
                            let tags = resData.map((item)=>{
                                return item.id
                            })
                            callback(null, tags, type)
                        })
                    },
                    //【step3】查看用户传的id有效性 有效则修改
                    (tags, type, callback)=>{
                        if(tags.indexOf(tag_id) == '-1'){
                            res.contentType('json');
                            res.send({
                                code: '-1',
                                desc: '传入的id不对'
                            })
                            return false;
                        }

                        let update_value = {tag: tag_id, tag_item: ''};
                        if(type == '2'){//已发布改成 发布更新
                            update_value = {tag: tag_id, type: '3', tag_item: ''};
                        }
                        BlogNoteArticle.update({id: param1}, {$set: update_value})
                        .exec((err)=>{
                            if(err)console.log(err);

                            let data = {
                                tag: tag_id,
                                tag_item: '',
                                type: type==2?'3':type
                            }
                            callback(null, data)
                        })
                    }
                ], (err, resData)=>{
                    if(err)console.log(err);
                    res.contentType('json');
                    res.send({
                        code: ResCode.success.c,
                        data: resData,
                        desc: ResCode.success.d
                    });
                })
                return false;
            }else if(param2 == 'tag_item'){//8.2
                let tag_item_id = req.body.tag || '';
                async.waterfall([
                    //【step1】排除错误情况
                    (callback)=>{
                        BlogNoteArticle.findOne({id: param1}, '-_id is_show user_id type tag tag_item')
                        .exec((err, _data)=>{
                            if(err)console.log(err);
                            if(!_data){
                                res.contentType('json');
                                res.send({
                                    code: ResCode.nofound.c,
                                    desc: ResCode.nofound.d+'当前文章'
                                });
                                return false;
                            }
                            let {user_id: u_id, is_show, type, tag, tag_item} = _data||'';
                            if(u_id != user_id){
                                res.contentType('json');
                                res.send({
                                    code: '-1',
                                    desc: '瞎几把搞，这不是你的文章 不能帮他设置标签'
                                });
                                return false;
                            }
                            if(!is_show){
                                res.contentType('json');
                                res.send({
                                    code: '-1',
                                    desc: '当前文章已经被删除了 不能设置'
                                });
                                return false;
                            }
                            if(tag_item == tag_item_id){
                                res.contentType('json');
                                res.send({
                                    code: '-1',
                                    desc: '不要重复提交，你当前已经是这个标签'
                                });
                                return false;
                            }
                            callback(null, type, tag)
                        })
                    },
                    //【step2】修改小标签
                    (type, tag, callback)=>{
                        let update_value = {tag_item: tag_item_id};
                        if(type == '2'){//已发布改成 发布更新
                            update_value = {tag_item: tag_item_id, type: '3'};
                        }
                        BlogNoteArticle.update({id: param1}, {$set: update_value})
                        .exec((err)=>{
                            if(err)console.log(err);


                            var data = {
                                tag,
                                tag_item: tag_item_id,
                                type: type == 2?'3':type
                            }
                            callback(null, data)
                        })
                    }
                ], (err, resData)=>{
                    if(err)console.log(err);
                    res.contentType('json');
                    res.send({
                        code: ResCode.success.c,
                        data: resData,
                        desc: ResCode.success.d
                    });
                })
                return false;
            }
        }else if( /^get$/i.test(method) ){
            if( param2 == 'content' ){//6.8
                BlogNoteArticle.findOne({id: param1}, '-_id user_id body title')
                .exec((err, _data)=>{
                    if(err)console.log(err);
                    if(!_data){
                        res.contentType('json');
                        res.send({
                            code: ResCode.nofound.c,
                            desc: ResCode.nofound.d+'该文章'
                        });
                        return false;
                    }
                    let {user_id: u_id, body, title} = _data || '';

                    if(u_id!=user_id){
                        res.contentType('json');
                        res.send({
                            code: '-1',
                            desc: '这不是你的文章，你仿佛在搞笑'
                        });
                        return false;
                    }
                    res.contentType('json');
                    res.send({
                        code: ResCode.success.c,
                        data:{
                            content: body,
                            title
                        },
                        desc: ResCode.success.d
                    });
                })
                return false;
            }
        }
    }

    res.contentType('json');
    res.send({
        code: ResCode.error.c,
        desc: ResCode.error.d+'不知道你要干啥，兄弟'
    });
    return false;
})

module.exports = router;










