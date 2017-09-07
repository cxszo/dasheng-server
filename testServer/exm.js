var cb0 = function (req, res, next) {
  console.log('CB0');
  next();
}

var cb1 = function (req, res, next) {
  console.log('CB1');
  next();
}

app.get('/example/d', [cb0, cb1], function (req, res, next) {
  console.log('response will be sent by the next function ...');
  next();
}, function (req, res) {
  res.send('Hello from D!');
});


app.get(/.*/, function(req, res) {
    let pn = url.parse(req.url).pathname
    if(/^.+(\.jpg|\.jpeg|\.png|\.gif)|\.js|\.css|\.scss$|\.go/.test(pn)){

    }else{
        if(!/\.html/.test(pn)){
            pn = pn+'.html'
        }
    }
    pn = decodeURIComponent(pn)
        
    pn = pn.substr(1)
    pn = lu+pn; 
    let exists = fs.existsSync(pn)
    if(!exists){
        pn = lu+'404.html'
    }
    console.log(pn)
    res.sendFile(pn);
});


app.get(/^\/(index(\.html)?)?/, function(req, res) {
  let pn = lu+'index.html'
  res.sendFile(pn);
})

app.set('view html', 'html')

app.get('/', function(req, res){
  res.render('index', {title:'woaini'})
})
app.get('/data/login', function(req, res){
  console.log(12)
  res.render('login', {
    title:'登录',
    data: '登成功'
  })
})


// var server = app.listen(3000, function () {
//   var host = server.address().address;
//   var port = server.address().port;

//   console.log('Example app listening at http://192.168.0.131', host, port);
// });


//signup
app.post('/data/register', (req, res)=>{

        var urlstr="";
        req.addListener("data",function(postdata){
            urlstr+=postdata;    //接收到的表单数据字符串，这里可以用两种方法将UTF-8编码转换为中文
            var jsondata = qs.parse(urlstr);        //转换成json对象
            var decodedata = decodeURIComponent(urlstr);        //对表单数据进行解码
            console.log(urlstr);
            console.log(jsondata);
            console.log(decodedata);
            urlstr = decodedata;
        });
        req.addListener("end",function(){
            res.writeHead(200,{"Content-Type":"text/plain; charset=utf-8"});
            res.write(urlstr);
            res.end();
        });

  
})



res.contentType('json');
res.send({
    code:'-1',
    desc:'待开发'
});
return false;




async.waterfall([
  //【step1】
  (callback)=>{

  },
  //【step2】
  (callback)=>{
      
  },
  //【step3】
  (callback)=>{
      
  },
  //【step4】
  (callback)=>{
      
  }
], (err)=>{
  if(err)console.log(err);
  res.contentType('json');
  res.send({
      code: ResCode.success.c,
      desc: ResCode.success.d
  });
})