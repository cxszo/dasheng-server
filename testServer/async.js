


var async =  require('async');




let a = function(){
    console.log('a')
    setTimeout(()=>{
        b('b');
    }, 1000)
    
}

let b = function (data){
    console.log(data)
}

// a();

async.waterfall([
    function(callback){
        console.log('a')
        setTimeout(()=>{
            callback(null, 'one1', 'tw1o');
        }, 1000)
    },
    function(arg1, arg2, callback){
        b('b--'+arg1+'+'+arg2);
     
        // callback(null, 'three');
   },
    function(arg1, callback){
        b('c');
       // arg1 now equals 'three'
       callback(null, 'done');
   }
   ], function (err, result) {
        b('d');
      // result now equals 'done'    
  });

