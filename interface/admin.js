var express = require('express');
var fs = require('fs')
var path = require('path')
var app = express();
var router = express.Router();
var User = require('../models/user')
var util = require('../util/')

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

//贷款运营-冯竹君
/**
 * 贷款数据
 * ps        一页显示多少条数据 默认不传 1000
 * pn        当前第几页 默认查第一页
 * startDate 查询的起始时间 默认上一个月 非自然月
 * endDate   查询的截止时间 默认今天
 */
router.get('/zhuj', (req, res)=>{
  let { startDate:start, endDate:end, ps='1000', pn='1' } = req.query;

  let filePath = path.resolve(process.cwd(), '../dasheng/admin/data/data.json');
  let desc = '查询成功'
  let result = [], data=[];
  try{
    result = fs.readFileSync(filePath, 'utf-8');
    result = JSON.parse(result).reverse();

    if(result.length){
      start = start || '';
      if(util.isDate(start)){
        start = new Date(start).getTime()
      }else{
        start = new Date().setMonth(new Date().getMonth()-1)//默认查 非自然月一个月的数据
      }
      end = end || '';
      if(util.isDate(end)){
        end = new Date(end).getTime()
      }else{
        end = new Date().getTime()
      }
      result = result.filter((v)=>{
        let { start_date, end_date } = v;
        return new Date(start_date).getTime() >= start && new Date(end_date).getTime() <= end
      })
      data = result.slice(ps*(pn-1), ps*pn);
      desc = data.length? desc : '当前页没有数据'
    }
  }catch(e){
    desc = '查询失败'
  }

  res.contentType('json');
  res.send({
      code:'1',
      data,
      ps,
      pn,
      total: result.length,
      desc
  });
  return false;
})


router.post('/login', (req, res)=>{
  let { userName, password } = req.body;
  let filePath = path.resolve(process.cwd(), '../dasheng/admin/data/user.json');
  let isSuccess = false, token = '';
  try{
    result = fs.readFileSync(filePath, 'utf-8');
    result = JSON.parse(result)

    result.forEach(v => {
      if( userName==v.userName && password==v.password){
        isSuccess = true;
        token = v.token
      }
    });
  }catch(e){}
  res.contentType('json');
  res.send({
    status: isSuccess?'ok':'error',
    token
  });
  return false;
})

router.get('/userinfo', (req, res)=>{
  let { token } = req.query;
  let filePath = path.resolve(process.cwd(), '../dasheng/admin/data/user.json');
  let isSuccess = false, name = '', avatar = '';
  try{
    result = fs.readFileSync(filePath, 'utf-8');
    result = JSON.parse(result)
    result.forEach(v => {
      if( token==v.token){
        isSuccess = true;
        name = v.userName
        avatar = v.headImg
      }
    });
  }catch(e){}
  res.contentType('json');
  res.send({
    status: isSuccess?'ok':'error',
    avatar,
    name
  });
  return false;
})


router.post('/edit', (req, res)=>{



  
  // let { userName, password } = req.body;
  // let filePath = path.resolve(process.cwd(), '../dasheng/admin/data/user.json');
  // let isSuccess = false, token = '';
  // try{
  //   result = fs.readFileSync(filePath, 'utf-8');
  //   result = JSON.parse(result)

  //   result.forEach(v => {
  //     if( userName==v.userName && password==v.password){
  //       isSuccess = true;
  //       token = v.token
  //     }
  //   });
  // }catch(e){}
  // res.contentType('json');
  // res.send({
  //   status: isSuccess?'ok':'error',
  //   token
  // });
  // return false;
})
module.exports = router;
