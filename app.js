



var express = require('express');
var app = express();
var router = express.Router();
var path = require('path');
var mongoose = require('mongoose')
let fs = require('fs')
var qs = require("querystring");
let url = require('url')
var bodyParse = require('body-parser')

// let lu = '/opt/www/';
let dev = require('./config/profile')


// if(dev == '1' || dev == '2'){
//   lu = '/Users/wangwei/GitHub-9188/dasheng/www/';//王炜本地
// }

mongoose.Promise = global.Promise;  
//链接数据库
if(dev == '1'){
  let options = {
    useMongoClient:true
    // server: {
    //   auto_reconnect: true,//是否自动重连接
    //   poolSize: 10//是连接池大小
    // }
  }

  mongoose.connect('mongodb://127.0.0.1:27017/wangweimac',options);
}else{
  const options = {
    user : "wangwei",
    pass : "wsxy/.0",
    useMongoClient:true
  }
  mongoose.connect('mongodb://59.110.143.111/dasheng', options);
}

var db = mongoose.connection

db.on('error', console.error.bind(console, '连接错误:'));
db.once('open', function() {
    console.log('连接成功');
});

app.use(bodyParse.urlencoded({extended: false}))
//处理跨域
app.all('*',function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , x-access-token');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');

  if (req.method == 'OPTIONS') {
    res.send(200);
  }
  else {
    next();
  }
});


//接口导进来
var indexInterface = require('./interface/index');
app.use('/', indexInterface);

var userInterface = require('./interface/users');
app.use('/user', userInterface);

var cdnInterface = require('./interface/cdn');
app.use('/cdn', cdnInterface);

var adminInterface = require('./interface/admin');
app.use('/admin', adminInterface);

var blogInterface = require('./interface/blog');
app.use('/blog', blogInterface);


//处理静态页面
// var options = {
//   dotfiles: 'ignore',
//   etag: true,
//   extensions: ['html', 'htm'],
//   index: 'index.html',
//   maxAge: '1d',
//   redirect: true,
//   setHeaders: function (res, path, stat) {
//     res.set('x-timestamp', Date.now());
//   }
// }
// app.use(express.static(lu, options));



// 如何处理 404 
// app.use(function(req, res, next) {
//     let pn = lu+'404.html'
//     var content =  fs.readFileSync(pn,"binary");   
//     res.status(404).sendFile(pn);
// });


app.listen(3000)

if(dev == 1 || dev == 2){
  let opn = require('opn')
  // opn('http://127.0.0.1:3000')
  // opn('http://192.168.0.131:3000')
  // opn('http://10.0.10.2:3000')
}
