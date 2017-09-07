



/*
*  wangwei 2017年08月15日
*  博客网站 文章评论
*  不需要登录
*  所有发布的文章都会进入这个表
*/
let blog_comment = {
    push_article_id:'',//发布的文章id
    userid:'',//评论人id
    cdate:'',//评论时间
    thumb:[user_id, ...xxx],//点赞人列表
    msg:'',//评论内容
    revert:[
        {
            userid:'',//回复人id
            name:'',//回复人名字
            cdate:'',//回复时间
            msg:'',//回复内容
            at_userid:'',//被@人id
            at_name:''//被@人名
        }
    ] 
}