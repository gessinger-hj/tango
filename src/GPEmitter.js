var T = require ( "./Tango" ) ;
var File = require ( "./File" ) ;
var Event = require ( "./gp/Event" ) ;
var Client = require ( "./gp/Client" ) ;

var event = T.getProperty ( "event", "notify" ) ;
var type = T.getProperty ( "type" ) ;
var json ;
var file = T.getProperty ( "file" ) ;
if ( file )
{
  json = new File ( file ).getJSON() ;
}
var e = new Event ( event, type ) ;
if ( json )
{
  e.data = json ;
}

var c = new Client() ;
c.fire ( e
       , { 
//            result: function(e)
//            {
// console.log ( " ----------result: function()----------------" ) ;
//              T.log ( e ) ;
//              this.end() ;
//            }
         error: function(e)
         {
           T.log ( e ) ;
           this.end() ;
         }
        , write: function()
           {
            this.end() ;
           }
         }
       ) ;
// c.on('end', function()
// {
//   console.log('socket disconnected');
// });
