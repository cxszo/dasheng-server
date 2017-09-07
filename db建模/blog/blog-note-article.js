

/*
*  wangwei 2017年08月20日
*  博客网站 文章表
*  需要登录
*  
*/

let blog_note_article = {
    userid:'',
    article_id:'',//文章id
    note_id:'',// 父级笔记本id
    title:'',//String 文章标题
    body:'',//String 文章内容
    createAt:'',//Date 创建时间
    deleteAt:'',//Date 删除时间
    type:'',//1私密 2已发布 3发布更新
    is_show:true,//Boolean 是否删除 true 没有被删除 false反之
    tag:'',//文章大分类
    note_type:'',//plain  markdown 
    tar_item:'',//小分类
    seq_in_nb:'',//排序
    history:[]//先不做放着
}