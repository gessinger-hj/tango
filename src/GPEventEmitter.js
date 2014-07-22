var T = require ( "Tango" ) ;
var GPEvent = require ( "GPEvent" ) ;
var GPClient = require ( "GPClient" ) ;

var c = new GPClient() ;

var ne = new GPEvent ( "alarm", "file" ) ;
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
         , Xwrite: function()
           {
console.log ( " ----------write: function()----------------" ) ;
              // this.end() ;
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
