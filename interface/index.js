var express = require('express');
var app = express();
var router = express.Router();
var User = require('../models/user')
var Increment = require('../models/blog/increment')
var BlogUser = require('../models/blog/blog_user')
var BlogNote = require('../models/blog/blog_note')
var BlogNoteArticle = require('../models/blog/blog_note_article')

var $global = require('../config/global')
var jwt = require('jsonwebtoken');

var async = require('async')
var bcrypt = require('bcrypt')
var SALT_WORK_FACTOR = 10;


//signup
router.post('/signup', (req, res)=>{
        var param = req.body;
        /*
        *   注册通过规则
        *   用户名必须是中文 切 2-6位
        *   手机号 不为空
        *   密码必须是[a-zA-Z0-9`~!@#$%^&*()_+-={}[]\|;:'"<,>.?/] 6-10位  
        *   return {code:1, desc:'用户名不对'}
        *   code 1成功 -1用户名不对  -2手机号不对  -3密码不对
        *
        */
        var filterName = /(齐天大圣|王炜|习近平|毛泽东|周恩来|操|干他娘|干她娘|妈逼)/;//设置敏感词语
        
        let {username, callphone, password} = param;
        password = Buffer.from(password, 'base64').toString()//对应atob
        if( !/^[\u4E00-\u9FA5]{2,6}$/.test(username) ){
            var response = {code:-1,desc:'请输入2-6位汉字'};
            res.contentType('json');
            res.send(response);
            return false;
        }else if( filterName.test(username) ){
            var response = {code:-1,desc:'包含了敏感词汇'};
            res.contentType('json');
            res.send(response);
            return false;
        }else if( !/^1[3|4|5|7|8]\d{9}$/.test(callphone) ){
            var response = {code:-2,desc:'手机号格式不正确'};
            res.contentType('json');
            res.send(response);
            return false;
        }else if( !/^[a-zA-Z0-9`~!@#$%^&*()-+_={}\[\]\\|;:'"<,>.?/]{6,10}$/.test(password) ){
            var response = {code:-3,desc:'密码格式不对'};
            res.contentType('json');
            res.send(response);
            return false;
        }else {
            async.waterfall([
                //【step1】查看用户名是否可用
                (callback)=>{
                    User.findOne({username}, (err, _data)=>{
                        if(err)console.log(err);
                        if(_data){
                            var response = {code:-1,desc:'用户名已存在'};
                            res.contentType('json');
                            res.send(response);
                            return false;
                        }
                        callback(null)
                    })
                },
                //【step2】查看手机号是否注册
                (callback)=>{
                    User.findOne({callphone}, (err, _data)=>{
                        if(err)console.log(err);
                        if(_data){
                            var response = {code:-2,desc:'手机号已注册'};
                            res.send(response);
                            return false;
                        }
                        callback(null)
                    })
                },
                //【step3】获取自增值
                (callback)=>{
                    Increment.findOneAndUpdate({"type":"userid"},{$inc:{id:1}},{new: true}, (err, userInc)=>{
                        if(err)return false;
                        let user_id = userInc.id;//用户id
                        Increment.findOneAndUpdate({"type":"noteid"},{$inc:{id:2}},{new: true}, (err, noteInc)=>{
                            if(err)return false;
                            let note_id = noteInc.id;//文集id
                            Increment.findOneAndUpdate({"type":"articleid"},{$inc:{id:2}},{new: true}, (err, articleInc)=>{
                                if(err)return false;
                                let article_id = articleInc.id;//文章id
                                Increment.findOneAndUpdate({"type":"push_articleid"},{$inc:{id:2}},{new: true}, (err, push_articleInc)=>{
                                    if(err)return false;
                                    let slug = push_articleInc.id;//发布文章id
                                    callback(null, user_id, note_id, article_id, slug)
                                })
                            })
                        })
                    })
                },
                //【step4】用户表 博客用户表 插入数据
                (user_id, note_id, article_id, slug, callback)=>{
                    var user = new User({username, callphone, password, user_id});
                    user.save((err)=>{
                        if(err) return console.log(err)
                        
                        BlogUser.create({ user_id, user_object_id:user, following:[], followers:[], collect:[], likelist:[], love:0,say:'' }, (err, _data)=>{
                            if(err)console.log(err);

                            callback(null, user_id, note_id, article_id, slug)
                        })
                            
                    })
                },
                //【step5】 默认  插入两个文集
                (user_id, note_id, article_id, slug, callback)=>{
                    BlogNote.insertMany([
                        {user_id,id: note_id-1,name: '随笔',seq: 1},
                        {user_id,id: note_id,  name: '日记',seq: 0}
                    ],(err, _data)=>{
                        callback(null, user_id, note_id, article_id, slug)
                    });
                },
                //【step6】默认 一个文集插入一个文章
                (user_id, note_id, article_id, slug, callback)=>{
                    BlogNoteArticle.insertMany([
                        {user_id,id: article_id-1, note_id: note_id-1, slug: slug-1, title:'无标题文章', body:'', seq_in_nb:0 },
                        {user_id,id: article_id,  note_id, slug, title:'无标题文章', body:'', seq_in_nb:0 }
                    ],(err, _data)=>{
                        callback(null)
                    });
                }
            ], (err)=>{
                var accessToken = jwt.sign({ username, password }, $global.token_key, { expiresIn: '168h' });
                var response = {code:1,data:{accessToken},desc:'注册成功'};
                res.contentType('json');//返回的数据类型
                res.send(response);//给客户端返回一个json格式的数据
            })
        }
})



//signin
router.post('/signin', (req, res)=>{
    /*
    *   注册通过规则
    *   return {code:1, desc:'用户名不对'}
    *   code 1成功 -1账号不对  -2密码格式不对 
    */
        var param = req.body;
        let {username, password} = param;
        password = Buffer.from(password, 'base64').toString()//对应atob
        if( !/^[\u4E00-\u9FA5]{2,6}$/.test(username) && !/^1[3|4|5|7|8]\d{9}$/.test(username) ){//用户
            var response = {code:'-1', desc:'帐号或密码错误'};
            res.send(response);
            return false;
        }
        if( !/^[a-zA-Z0-9`~!@#$%^&*()-+_={}\[\]\\|;:'"<,>.?/]{6,10}$/.test(password) ){
            var response = {code:'-2', desc:'帐号或密码错误'};
            res.send(response);
            return false;
        }
       
        
        if( /^[\u4E00-\u9FA5]{2,6}$/.test(username)){//根据用户名查
            User.find({username}, (err, _user)=>{
                if(err)console.log(err)
                if(!_user.length){
                    let response = {code:0,desc:'用户不存在'};
                    res.send(response);
                    return false;
                }else{
                    let user = new User(_user[0]);
                    user.comparePassword(password, (err, isMatch)=>{
                        let response = {code:'-1', desc:'帐号或密码错误'};
                        if(isMatch){
                            var accessToken = jwt.sign({
                                username, password
                            }, $global.token_key, { expiresIn: '24h' });
                            response = {code:'1',data:{accessToken}, desc:'登录成功'};
                        }
                        res.send(response);
                    })
                }
            })
        }else{//根据手机号查
            User.find({callphone: username}, (err, _user)=>{
                if(err)console.log(err)
                if(!_user.length){
                    let response = {code:0,desc:'手机号不存在'};
                    res.send(response);
                    return false;
                }else{
                    let user = new User(_user[0]);
                    user.comparePassword(password, (err, isMatch)=>{
                        let response = {code:'-2', desc:'帐号或密码错误'};
                        if(isMatch){
                            var accessToken = jwt.sign({
                                username, password
                            }, $global.token_key, { expiresIn: '24h' });
                            response = {code:'1',data:{accessToken}, desc:'登录成功'};
                        }
                        res.send(response);
                    })
                }
            })
        }
})





module.exports = router;