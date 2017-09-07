
var express = require('express');
var app = express();
var router = express.Router();
var jwt = require('jsonwebtoken');//用来创建和确认用户信息摘要

var $global =require('../config/global')
var User = require('../models/user')

// 检查用户会话
module.exports = function(req, res, next) {
  //检查post的信息或者url查询参数或者头信息
  var accessToken = req.params.accessToken || req.query.accessToken || req.headers['x-access-token'] || req.body.accessToken;
  // 解析 token
  if (accessToken) {
    // 确认token
    jwt.verify(accessToken, $global.token_key, function(err, decoded) {
      if (err) {
        req.api_user = 'token过期,请重新登录';
        next();
        return false;
      } else {
              var {username, password} = decoded;
              let callphone = ''
              let data = ''
              if(/^\d*$/.test(username)){
                  callphone = username
                  data = {callphone}
              }else{
                  data = {username}
              }
              //王炜-warning   token 我没有对比密码 可能后面会有问题 
              User.find(data, (err, _user)=>{
                let ui = _user[0] || '';
                if(ui.username){
                  // 如果没问题就把解码后的信息保存到请求中，供后面的路由使用
                  req.api_user = ui;
                  next();
                }else{
                    // token 有效但是 数据库里面没有该用户 很有可能是操作数据库删除了用户
                    req.api_user = '不存在该用户';
                    next();
                }
                return false;
              })
      }
    });
  } else {
    // 如果没有token，则返回错误
    req.api_user = '用户没登录';
    next();
  }
};