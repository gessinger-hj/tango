var T = require ( "./Tango" ) ;
var File = require ( "./File" ) ;
var Event = require ( "Event" ) ;
var Client = require ( "Client" ) ;

var e ;

// var event = T.getProperty ( "event", "notify" ) ;
// var type = T.getProperty ( "type" ) ;
// var json ;
// var file = T.getProperty ( "file" ) ;
// if ( file )
// {
//   json = new File ( file ).getJSON() ;
// }
// var e = new Event ( event, type ) ;
// if ( json )
// {
//   e.body = json ;
// }

var c = new Client() ;

// c.fire ( e
//        , { 
//          error: function(e)
//          {
//            T.log ( e ) ;
//            this.end() ;
//          }
//         , write: function()
//            {
//             this.end() ;
//            }
//          }
//        ) ;

// c.fire ( "message-test"
//        , { 
//            result: function(e)
//            {
// console.log ( " ----------result: function()----------------" ) ;
//              T.log ( e ) ;
//              this.end() ;
//            }
//         , error: function(e)
//          {
//            T.log ( e ) ;
//            this.end() ;
//          }
//          }
//        ) ;
var ee = new Event ( "tail" ) ;
// ee.setFailureInfoRequested() ;
c.fire ( ee
, {
    write: function()
    {
T.lwhere (  ) ;
    },
    failure: function(e)
    {
      T.log ( e ) ;
      if ( e.isBad() )
      {
        this.end() ;
      }
    }
  }
);
return ;
var ee = new Event ( "alarm" ) ;
// ee.setIsBroadcast() ;
// c.broadcast ( ee
c.request ( ee
       , { 
           result: function(e)
           {
console.log ( " ----------result: function()----------------" ) ;
// remove result callback by uid
             T.log ( e ) ;
             // this.end() ;
           }
        , error: function(e)
         {
           T.log ( e ) ;
           this.end() ;
         }
         }
       ) ;
// c.on('end', function()
// {
//   console.log('socket disconnected');
// });
