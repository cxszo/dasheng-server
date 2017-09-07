var express = require('express');
var router = express.Router();
var qs = require("querystring");

var fs = require('fs'),
    stdin = process.stdin,
    stdout = process.stdout;
var stats = [];

let dev = require('../config/profile')



//获取列表数据
router.get('/list', (req, res)=>{
    let charAt = req.query.charAt
    if(charAt == ''){
        let response = {code:0,desc:'没有数据'};
        res.contentType('json');
        res.send(response);
        return false;
    }
    let uri = '/opt/cdn/libs/'
    if(dev == '1' || dev == '2'){
        uri = '/Users/wangwei/cdn/libs/'
    }
    let files = fs.readdirSync(uri)
    if(!files.length){
        let response = {code:0,desc:'没有数据'};
        res.contentType('json');
        res.send(response);
        return false;
    }else{
        let rep = new RegExp(charAt+'(?!s)', 'i')
        let arrJs = []
        files.map((item, index)=>{
            if(rep.test(item)){
                let link = ''//没有package.json 文件的时候 传空
                try{
                    link = JSON.parse(fs.readFileSync(`${uri}${item}/package.json`)) || '';
                    if(link.version && link.filename){
                        link = `/libs/${item}/${link.version}/${link.filename}`
                    }else{
                        link = ''
                    }
                }catch(e){}
                arrJs.push({
                    title:item,link
                })
            }
        })

        let response = {code:1,data:arrJs, desc:'success'};
        res.contentType('json');
        res.send(response);
        return false;
    }
})

//获取指定库 版本列表
router.get('/list/:id', (req, res)=>{
    let charAt = req.params.id


    if(charAt == ''){
        let response = {code:0,desc:'请传入库名称'};
        res.contentType('json');
        res.send(response);
        return false;
    }
    let uri = `/opt/cdn/libs/${charAt}/`
    if(dev == '1' || dev == '2'){
        uri = `/Users/wangwei/cdn/libs/${charAt}/`
    }
    let version = fs.readdirSync(uri) || [];
    let packageJson = '';
    if(version.indexOf('package.json')>=0){
        packageJson = version.splice(version.indexOf('package.json'), 1)
    }
    version.reverse();
    let fresh = fs.readdirSync(`${uri}${version[0]}/`) || [];//默认帮他查最新的版本
    fresh.reverse()
    fresh = fresh.map(item=>{
        return `/libs/${charAt}/${version[0]}/${item}`
    })
    if(!version.length){
        let response = {code:0,desc:'没有数据'};
        res.contentType('json');
        res.send(response);
        return false;
    }
    let info = {}
    if(packageJson){
       var result= JSON.parse(fs.readFileSync(`${uri}${packageJson}`)) || {};
        info = {
            homepage: result.homepage || '',
            description: result.description || '',
            repository: result.repository || result.repositories || '',
            keywords: result.keywords || ''
        }
        if(info.repository.constructor === Array){//有可能repository是一个数组 内容在数组的第一个元素里面
            if(info.repository.length){
                info.repository = info.repository[0]
            }else{
                info.repository = '';
            }
        }
    }
    let data = {
        version,
        fresh,
        info
    }
    let response = {code:1,data,desc:'查询成功'};
    res.contentType('json');
    res.send(response);
    return false;
})

//获取指定库 指定版本 数据列表
router.get('/list/:l/:v', (req, res)=>{
    let library = req.params.l,
        version = req.params.v;
    if(library =='' || version==''){
        let response = {code:0,desc:'库名或者版本号没传'};
        res.contentType('json');
        res.send(response);
        return false;
    }
    let uri = `/opt/cdn/libs/${library}/${version}/`
    if(dev == '1' || dev == '2'){
        uri = `/Users/wangwei/cdn/libs/${library}/${version}/`
    }
    let libs = fs.readdirSync(uri) || [];
    libs.reverse()
    libs = libs.map(item=>{
        return `/libs/${library}/${version}/${item}`
    })
    let response = {code:1,data:libs,desc:'查询成功'};
    res.contentType('json');
    res.send(response);
    return false;
})








module.exports = router;