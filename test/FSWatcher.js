
var fs = require ( "fs" ) ;

var fsFSWatcher = fs.watch ( ".", function ( ename, fname )
{
  console.log ( "ename=" + ename ) ;
  console.log ( "fname=" + fname ) ;
});
console.log ( fsFSWatcher ) ;
