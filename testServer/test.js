var express = require('express');
var app = express();

app.get('/', function(req, res){
  res.send('hello world');
});

app.listen(3000);



if(typeof api_user == 'string'){
    res.contentType('json');
    res.send({
        code: ResCode.nofound.c,
        desc: api_user
    });
    return false;
}

let user_id = api_user.user_id || '';
BlogNote.find({user_id}, '-_id id name seq createAt is_show')
.sort({seq: 1})
.exec((err, _data)=>{
    if(err)console.log(err);

    res.contentType('json');
    res.send({
        code: ResCode.success.c,
        data: _data,
        desc: ResCode.success.d
    });
    return false;
})




// 5.2写-排序文集、文章
router.post('/note/note_sort', (req, res)=>{
  res.contentType('json');
  res.send({
      code: ResCode.success.c,
      desc: ResCode.success.d
  });
  return false;
})
// 5.3写-拿文集id查文章列表

router.post('/note/articlelist', (req, res)=>{
  res.contentType('json');
  res.send({
      code: ResCode.success.c,
      desc: ResCode.success.d
  });
  return false;
})
// 5.4写-拿文章id查文章
router.post('/note/article', (req, res)=>{
  res.contentType('json');
  res.send({
      code: ResCode.success.c,
      desc: ResCode.success.d
  });
  return false;
})
// 5.5写-删除,新建,重命名文集
router.post('/note/act', (req, res)=>{
  res.contentType('json');
  res.send({
      code: ResCode.success.c,
      desc: ResCode.success.d
  });
  return false;
})
// 5.6写-删除, 取消发布, 恢复， 彻底删除
router.post('/note/article/act', (req, res)=>{
  res.contentType('json');
  res.send({
      code: ResCode.success.c,
      desc: ResCode.success.d
  });
  return false;
})
// 5.7写-发布文章，保存文章
router.post('/article/save', (req, res)=>{
  res.contentType('json');
  res.send({
      code: ResCode.success.c,
      desc: ResCode.success.d
  });
  return false;
})
// 5.8写-新增文章
router.post('/note/article/create', $middlewares, (req, res)=>{
  var api_user = req.api_user || '';//本人的登录信息
  var {note_id, seq_in_nb, title} = req.body || '',
  note_id = note_id || '',
  seq_in_nb = seq_in_nb || '',
  title = title || '';


  if(typeof api_user == 'string'){
      res.contentType('json');
      res.send({
          code: ResCode.nofound.c,
          desc: api_user
      });
      return false;
  }
  if(!note_id || !seq_in_nb ){
      res.contentType('json');
      res.send({
          code: ResCode.error.c,
          desc: '请传入note_id和seq_in_nb'
      });
      return false;
  }   

  



  res.contentType('json');
  res.send({
      code: ResCode.success.c,
      desc: ResCode.success.d
  });
  return false;
})
// 5.9写-设置文章标签
router.post('/note/article/settag', (req, res)=>{
  res.contentType('json');
  res.send({
      code: ResCode.success.c,
      desc: ResCode.success.d
  });
  return false;
})

// 6.1查询回收站列表
router.post('/note/dustbin', (req, res)=>{
  res.contentType('json');
  res.send({
      code: ResCode.success.c,
      desc: ResCode.success.d
  });
  return false;
})





/* 1 */
{
    "_id" : ObjectId("599e38f20784dcb2fd2d4ade"),
    "user_id" : 2222239.0,
    "user_object_id" : "599d4b98e3563e7d5e209825",
    "push_article_id" : 81234790.0,
    "note_id" : 150026.0,
    "article_id" : 150001.0,
    "img_url" : "http://upload-images.jianshu.io/upload_images/2829363-7085cce6e654b78b.jpg",
    "title" : "小说：死亡前的众生相",
    "body" : "李佩瑜躺在地上，头脑混沌得像盘古开天地之前的宇宙。意识已经从她的躯体抽离她是在接孙子放学的路上出的事儿。“妈咋样了？”",
    "createAt" : "2017-08-24 10:21",
    "love" : [ 
        {
            "user_id" : 2222239,
            "name" : "听海",
            "headimg" : "http://ov0zo91tq.bkt.clouddn.com/headimg/default/9887.jpg",
            "cdate" : ISODate("2017-08-28T06:26:36.057Z"),
            "_id" : ObjectId("59a3b79cfce0f61a2b82b30b")
        }
    ],
    "read" : 111.0,
    "tag" : "1",
    "tag_item" : "1_1",
    "is_show" : true,
    "comment" : [ 
        "599e4b9f0784dcb2fd2d4ae0", 
        "599e4efb0784dcb2fd2d4ae2"
    ],
    "user_objec_id" : "599d4b98e3563e7d5e209826"
}

/* 2 */
{
    "_id" : ObjectId("599e39de0784dcb2fd2d4adf"),
    "user_id" : 2222239.0,
    "user_object_id" : "599d4b98e3563e7d5e209825",
    "push_article_id" : 81234791.0,
    "note_id" : 150026.0,
    "article_id" : 150002.0,
    "img_url" : "http://upload-images.jianshu.io/upload_images/5993567-da6d18dad59a39de.jpg",
    "title" : "贫穷如你，要如何追求诗和远方？",
    "body" : "自从我开始写游记，便一发不可收拾，连我都惊叹自己的创作力，竟然能一篇接一篇地写个没完。游记写多了，慢慢地就给人带来一种错觉，读者们都以为我很有钱还很有闲，有人猜我是个富二代，有人猜我是个富太太，有人猜我是个拆迁户，更有黑暗料理制造者，猜我是个被养在金屋的小三儿，猜我是个被富婆包养的小鲜肉。这想象力，也是无敌了！郑重地声明一下，虽然我爱撩妹子，但我真的是个小仙女。那我到底是穷还是富？你猜！童话只在故事里，仙女唯应天上有。现实中的我，就是一个又穷又爱显摆爱嘚瑟的老屌丝，正因为这三个因素完美地结合，才促成我在简书写出这么多游记。我的朋友们知道我写游记后，都对我刮目相看，每次见面都啧啧称赞：“小满这厮，装×都能装得这么清新脱俗，也是没sei了……” 嗯，我不否认，这就是我的风格。",
    "createAt" : "2017-08-25 10:21",
    "love" : [ 
        {
            "user_id" : 2222239,
            "name" : "听海",
            "headimg" : "http://ov0zo91tq.bkt.clouddn.com/headimg/default/9887.jpg",
            "cdate" : ISODate("2017-08-30T03:56:43.141Z"),
            "_id" : ObjectId("59a6377b26d95a10adb0b040")
        }, 
        {
            "user_id" : 2222240,
            "name" : "来了",
            "headimg" : "http://ov0zo91tq.bkt.clouddn.com/headimg/default/9887.jpg",
            "cdate" : ISODate("2017-08-25T08:37:42.298Z"),
            "_id" : ObjectId("599fe1d6c734cd265b3e0626")
        }
    ],
    "read" : 1457.0,
    "tag" : "2",
    "tag_item" : "2_1",
    "is_show" : true,
    "comment" : [ 
        "599e4d2f0784dcb2fd2d4ae1"
    ]
}