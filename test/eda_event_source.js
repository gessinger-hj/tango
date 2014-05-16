var T = require ( "Tango" ) ;
require ( "NEvent" ) ;
require ( "Client" ) ;
require ( "File" ) ;

// var f = new tangojs.File ( "r.txt" ) ;
// var buf = f.toBuffer() ;

var c = new tangojs.Client() ;

var ne = new tangojs.NEvent ( "alarm", "file" ) ;
// ne.data.fileContent = buf ;
// T.log ( ne ) ;
c.fire ( ne
       , { result: function(e)
           {
console.log ( " ----------result: function()----------------" ) ;
             T.log ( e ) ;
             this.end() ;
           }
         , error: function(e)
           {
console.log ( " ----------error: function()----------------" ) ;
             T.log ( e ) ;
             this.end() ;
           }
         , write: function()
           {
console.log ( " ----------write: function()----------------" ) ;
              this.end() ;
           }
         }
       ) ;

// c.fire ( { name:"alarm"
//          , type:"for fun"
//          }
//        , { result: function(e)
//            {
//              T.log ( e ) ;
//              this.end() ;
//            }
//          , callback: function()
//            {
//               // this.end() ;
//            }
//          }
//        ) ;

c.on('end', function()
{
  console.log('socket disconnected');
});
