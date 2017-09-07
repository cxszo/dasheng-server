



/*
*  wangwei 2017年08月15日
*  博客网站 所有发布的文章
*  不需要登录
*  所有发布的文章都会进入这个表
*/
let blog_article = {
    user_id:'', //Number 用来查作者信息博主名 博主头像
    push_article_id:'',//Number 已发布文章id
    note_id:'',//笔记本id
    article_id:'',//文章id
    img_url:'',//文章里面的图片（可空）
    title:'',//String 文章标题
    body:'',//String 文章内容
    createAt:'',//Date 第一次发布时间
    love:[//Array 点赞的用户
        {
            user_id:'',//点赞人
            name:'',//点赞人名
            headimg:'',//点赞人头像
            cdate:''//点赞时间
        }
    ],
    read:'',//Number 文章被阅读次数 自己打开的不算
    tag:'',//文章大分类
    tag_item:'',//小分类
    is_show:true,//是否显示当前文章 true 显示 false 不显示
}

