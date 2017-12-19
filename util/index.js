






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
    },
    /**
     * 判断传入的值是否是时间字符串 
     * @param {String} dateString 日期字符串
     * example:
     * 2017/12/19  > true
     * 2017-12-19  > true
     * else  > false
     */
    isDate(dateString){
      if(dateString.trim()==""){
        return false;
      }
      var r=dateString.match(/^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2})$/); 
      if(r==null){
        return false;
      }
      var d=new Date(r[1],r[3]-1,r[4]);   
      var num = (d.getFullYear()==r[1]&&(d.getMonth()+1)==r[3]&&d.getDate()==r[4]);
      if(num==0){
      }
      return (num!=0);
   } 
  


}