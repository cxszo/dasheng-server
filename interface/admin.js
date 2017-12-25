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



function addCheck( res ) {
  let { end_date } = res
  let day7 = 7 * 24 * 60 * 60 * 1000;
  return (Date.now() - new Date(end_date).getTime()) > day7 
}

function addDate( result, filePath ) {
  let { start_date, end_date } = result[0]
  let new_start_date = '', new_end_date = '';
  end_date =  new Date(end_date)
  new_start_date = new Date(end_date.setDate(end_date.getDate()+1))
  new_start_date = `${new_start_date.getFullYear()}-${new_start_date.getMonth()+1}-${new_start_date.getDate()}`
  new_end_date = new Date(end_date.setDate(end_date.getDate()+6))
  new_end_date = `${new_end_date.getFullYear()}-${new_end_date.getMonth()+1}-${new_end_date.getDate()}`


  // let new_res = [...result].reverse()
  let new_res = JSON.parse(JSON.stringify(result)).reverse()
  let back_up = path.resolve(process.cwd(), `../dasheng/admin/data/data_${start_date}_${end_date}.json`);
  fs.writeFileSync(back_up, JSON.stringify(new_res))//备份
  new_res.push({"recharge":"0 ","add":"0","apply":"0","buy":"0","recharge_user":"0","profit":"0 ","refund":"0 ","start_date":new_start_date, "end_date":new_end_date})
  new_res = JSON.stringify(new_res);
  fs.writeFileSync(filePath, new_res)//备份
}

//贷款运营-冯竹君
/**
 * 贷款数据
 * ps        一页显示多少条数据 默认不传 1000
 * pn        当前第几页 默认查第一页
 * startDate 查询的起始时间 默认上一个月 非自然月
 * endDate   查询的截止时间 默认今天
 */
router.get('/zhuj', (req, res)=>{
  let { startDate:start, endDate:end, ps='1000', pn='1', token } = req.query;

  if( !token ){
    res.contentType('json');
    res.send({
        code:'2',
        desc:'请先登录'
    });
    return ;
  }
  let auth = 0;//没有登录的是0 普通用户是1  管理员是99
  let filePath_user = path.resolve(process.cwd(), '../dasheng/admin/data/user.json');
  try{
    user = fs.readFileSync(filePath_user, 'utf-8');
    user = JSON.parse(user)

    user.forEach(v => {
      if( token == v.token ){
        auth = v.auth
      }
    });
  }catch(e){}

  let filePath = path.resolve(process.cwd(), '../dasheng/admin/data/data.json');
  let desc = '查询成功'
  let result = [], data=[];
  try{
    result = fs.readFileSync(filePath, 'utf-8');
    result = JSON.parse(result).reverse();


    if(result.length){
      if(addCheck( result[0] )){
        addDate(result, filePath)
      }

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
      let day3 = 3 * 24 * 60 * 60 * 1000;
      result = result.filter((v)=>{
        let { start_date, end_date } = v;
        //划分规则 如果一个周中有四天以上含四天在这个月 那就算这个月的数据
        if ( new Date(start_date).getTime() <= start && new Date(end_date).getTime() >= start ) {
          return start - new Date(start_date).getTime() <= day3
        } else if ( new Date(start_date).getTime() <= end && new Date(end_date).getTime() >= end ) {
          return new Date(end_date).getTime() - end <= day3
        } else {
          return new Date(start_date).getTime() >= start && new Date(end_date).getTime() <= end
        }
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
      auth,
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

  let { date, add, buy, profit, recharge, apply, recharge_user, refund } = req.body;
  let start_date = date.split('~')[0]
  let end_date = date.split('~')[1]
  let filePath = path.resolve(process.cwd(), '../dasheng/admin/data/data.json');
  result = fs.readFileSync(filePath, 'utf-8');

  result = JSON.parse(result)
  let newArr = result.map(( v )=>{
    if( start_date == v.start_date ){
      return Object.assign({}, v, {
        add,
        buy,
        profit, 
        recharge,
        apply,
        recharge_user,
        refund,
      })
      // return {
      //   ...v,
      //   add,
      //   buy,
      //   profit, 
      //   recharge,
      //   apply,
      //   recharge_user,
      //   refund,
      // }
    }else{
      return v
    }
  })
  fs.writeFileSync(filePath, JSON.stringify(newArr))
  res.contentType('json');
  res.send({
    status: 'ok'
  });
  return false;
})
module.exports = router;
