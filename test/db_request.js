var T = require ( "Tango" ) ;
var NEvent = require ( "NEvent" ) ;
var Client = require ( "Client" ) ;

var client = new Client() ;

var ne = new NEvent ( "DB:REQUEST" ) ;
client.fire ( ne
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
client.on('end', function()
{
  console.log('socket disconnected');
});
