

let http = require('http')
let url = require('url')
let fs = require('fs')
let path = require('path')

let contentType = {
  "css": "text/css",
  "gif": "image/gif",
  "html": "text/html",
  "ico": "image/x-icon",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "js": "text/javascript",
  "json": "application/json",
  "pdf": "application/pdf",
  "png": "image/png",
  "svg": "image/svg+xml",
  "swf": "application/x-shockwave-flash",
  "tiff": "image/tiff",
  "txt": "text/plain",
  "wav": "audio/x-wav",
  "wma": "audio/x-ms-wma",
  "wmv": "video/x-ms-wmv",
  "xml": "text/xml"
}
let lu = '/Users/wangwei/dasheng/www/';//王炜本地
// let lu = '/opt/www/'; //线上
let server = http.createServer((req, res)=>{
        let pn = url.parse(req.url).pathname

        if( /\/$/.test(pn) ){
            pn = pn+'index.html'
        }else{
            if(/^.+(\.jpg|\.jpeg|\.png|\.gif)|\.js|\.css|\.scss$|\.go/.test(pn)){

            }else{
                if(!/\.html/.test(pn)){
                    pn = pn+'.html'
                }
            }
            pn = decodeURIComponent(pn)
            
        }
        pn = pn.substr(1)
        console.log(pn)
        pn = lu+pn; 
        let exists = fs.existsSync(pn)
        
        if(!exists){
            pn = lu+'404.html'
        }

        res.setHeader("Content-Type", contentType);
        // //格式必须为 binary 否则会出错
        var content =  fs.readFileSync(pn,"binary");   
        res.write(content,"binary"); //格式必须为 binary，否则会出错
        res.end();
})
 server.listen(3000, '127.0.0.1', ()=>{
    console.log('服务器启动成功')
})














// let http = require('http')
// let url = require('url')
// let util = require('util')

// let fs = require('fs')

// let server = http.createServer((req, res)=>{
//         res.statusCode = 200;

//         res.setHeader("Content-Type", "text/plain")
//         var pathname = url.parse(req.url).pathname;


        // if(!/\.html/.test(pathname)){
        //     pathname = pathname+'.html'
        // }
        // pathname = decodeURIComponent(pathname)
        // console.log(pathname)
        // fs.readFile(pathname.substr(1), (err, data)=>{
        //     if(err){
        //         res.writeHead(404, {
        //             'Content-Type': 'text/html; charset=utf-8'
        //         });
        //         res.write('当前页面找不到')
        //     }else{
        //         res.writeHead(200, {
        //             'Content-Type': 'text/html; charset=utf-8'
        //         })
        //         res.write(data.toString())
        //     }
        //     res.end()
        // })
//         // res.end(util.inspect(url.parse(req.url)))
// })


