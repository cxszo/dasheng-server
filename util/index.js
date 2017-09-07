






module.exports = {

    /*
    * mongoose 查询出来的都是Array 类型
    * 我们遍历Array之前需要先确认它是不是一个Array
    * return 1正常 -1不是Array -2查询不存在
    */
    check_cb(data){
        if(!data instanceof Array)
            return -1;
        if(!data.length)
            return -2;
        return 1;
    }


}