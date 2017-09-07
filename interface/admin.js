var express = require('express');
var app = express();
var router = express.Router();
var User = require('../models/user')

//查看注册用户列表
router.get('/userlist', (req, res)=>{
    User.findUserList((err, _user)=>{
        
        
        
        let __user = _user.map((item)=>{
            let { user_id, callphone, username, meta } = item
            callphone = (callphone+'').replace(/(\d{3}).+(\d{4})/, '$1****$2');
            return {
                user_id, callphone, username, meta
            }
        })

        res.contentType('json');
        res.send({
            code:'1',
            data:__user,
            desc:'查询成功'
        });
        return false;
    })
})


module.exports = router;