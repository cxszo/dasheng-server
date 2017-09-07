var express = require('express');
var app = express();
var router = express.Router();
var User = require('../models/user')

var $middlewares = require('./mount-middlewares');

//查看用户信息
router.get('/userinfo', $middlewares,  (req, res)=>{
    let api_user = req.api_user || '后端数据异常'
    if(typeof req.api_user === 'object'){
        let {username, callphone, headimg, user_id} = api_user;
        res.contentType('json');
        res.send({
            code:'1',
            data:{
                user_id,
                headimg,
                username,
                callphone
            },
            desc:'查询成功'
        });
        return false;
    }else{
        res.contentType('json');
        res.send({
            code:'0',
            desc: api_user
        });
        return false;
    }
})


module.exports = router;

