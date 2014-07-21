var TangoClass = require('./TangoClass.js') ;
var Tango = new TangoClass() ;

var fs = require('fs') ;

var files = fs.readdirSync(__dirname) ;

for(var i in files) {
   var name = files[i] ;
   if(!name.endsWith('.js') || name === 'index.js' || name === 'TangoClass.js') {
      continue;
   }
   
   //console.log(files[i]) ;
   Tango[name] = require('./'+name)(Tango) ;
}


module.exports = Tango ;

