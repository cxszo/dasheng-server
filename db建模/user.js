

/*
*  wangwei 2017年08月15日
*  全站用户基本信息表
*  需登录查看
*  插入一条数据的时候  帮自动创建blog-user blog-send两个表
*/
let user = {
    user_id:'',//用户的唯一标识  从1000000 开始自增
    username:'',//用户姓名 2-6个汉字（只能输入汉字）
    callphone:'',//手机号 11位数字
    password:'',// 密码 6-10位 （字母 数字 符号）
    headimg:'',//用户头像链接
    meta:{
        updateAt:'',//更新时间
        createAt:''//创建时间 
    }
}