module.exports = function(T) {
   var counter = 0 ;
   var WebClient = function ( port )
   {
     this.port = port ;
     this.webSocket = null ;
     this.user = null ;
     this.pendingEventList = [] ;
     this.pendingResultList = {} ;
     this.callbacks = {} ;
     this.eventListenerFunctions = new tangojs.MultiHash() ;
     this.pendingEventListenerList = [] ;
     this.url = "ws://" + document.domain + ":" + this.port ;
   };
   WebClient.prototype._initialize = function()
   {
   };
   WebClient.prototype.createUniqueEventId = function()
   {
     return this.url + "_" + new Date().getTime() + "-" + (tangojs.counter++) ;
   };
   WebClient.prototype.connect = function()
   {
     var thiz = this ;
     this.webSocket = new WebSocket ( this.url ) ;
     this.webSocket.onerror = function(err)
     {
       if ( ! thiz.webSocket ) return ;
       thiz.webSocket.close() ;
       thiz.webSocket = null ;
     } ;
     this.webSocket.onmessage = function onmessage ( messageEvent )
     {
       var mm = messageEvent.data ;
       if ( ! this.partialMessage ) this.partialMessage = "" ;
       mm = this.partialMessage + mm ;
       this.partialMessage = "" ;
       var messageList = thiz.splitJSONObjects ( mm ) ;

       var j = 0 ;
       for ( j = 0 ; j < messageList.length ; j++ )
       {
         var m = messageList[j] ;
         if ( m.length === 0 )
         {
           continue ;
         }
         if ( j === messageList.length - 1 )
         {
           if ( m.charAt ( m.length - 1 ) !== '}' )
           {
             this.partialMessage = m ;
             break ;
           }
         }
         if ( m.charAt ( 0 ) === '{' )
         {
           var e = tangojs.deserialize ( m ) ;
           var wid = e.getWebIdentifier() ;
           if ( e.isResult() )
           {
             var ctx = thiz.callbacks[wid] ;
             delete thiz.callbacks[wid] ;
             var rcb = ctx.result ;
             rcb.call ( thiz, e ) ;
             continue ;
           }
           if ( e.getName() === "system" )
           {
             if ( e.getType() === "shutdown" )
             {
               return ;
             }
             if ( e.isBad() )
             {
               var ctx = thiz.callbacks[wid] ;
               delete thiz.callbacks[wid] ;
               var rcb = ctx.error ;
               if ( rcb )
               {
                 rcb.call ( thiz, e ) ;
               }
               continue ;
             }
           }
           else
           {
             var callbackList = thiz.eventListenerFunctions.get ( e.getName() ) ;
             if ( ! callbackList )
             {
               log ( "callbackList for " + e.getName() + " not found." ) ;
               log ( e ) ;
             }
             for  ( j = 0 ; j < callbackList.length ; j++ )
             {
               callbackList[j].call ( thiz, e ) ;
             }
           }
         }
       }

     } ;
     this.webSocket.onclose = function onclose(e)
     {
       if ( ! thiz.webSocket ) return ;
       thiz.webSocket = null ;
     } ;
     this.webSocket.onopen = function()
     {
       var i ;
       if ( thiz.pendingEventList.length )
       {
         var uid = thiz.createUniqueEventId() ;
         for ( i = 0 ; i < thiz.pendingEventList.length ; i++ )
         {
           var ctx = thiz.pendingEventList[i] ;
           var e = ctx.e ;
           var resultCallback = ctx.resultCallback ;
           e.setWebIdentifier ( uid ) ;
           thiz.callbacks[uid] = ctx ;
           ctx.e = undefined ;
           thiz.webSocket.send ( e.serialize() ) ;
         }
         thiz.pendingEventList.length = 0 ;
       }
       if ( thiz.pendingEventListenerList.length )
       {
         for ( i = 0 ; i < thiz.pendingEventListenerList.length ; i++ )
         {
           var ctx = thiz.pendingEventListenerList[i] ;
           var e = ctx.e ;
           var callback = ctx.callback ;
           e.setWebIdentifier ( uid ) ;
           thiz.webSocket.send ( e.serialize() ) ;
         }
         thiz.pendingEventListenerList.length = 0 ;
       }
     };
   };
   WebClient.prototype.getSocket = function()
   {
     if ( ! this.webSocket )
     {
       this.connect() ;
     }
     return this.webSocket ;
   };
   WebClient.prototype.fireEvent = function ( params, callback )
   {
     var e = null ;
     if ( params instanceof NEvent )
     {
       e = params ;
     }
     else
     {
       e = new tangojs.NEvent ( params.name, params.type ) ;
       e.setData ( params.data ) ;
       if ( params.user ) u = params.user ;
     }
     if ( this.user )
     {
       e.setUser ( this.user ) ;
     }
     var ctx = {} ;
     if ( callback )
     {
       if ( typeof callback === 'object' )
       {
         ctx.result = callback.result ;
         if ( ctx.result ) e.setRequestResult() ;
         ctx.error = callback.error ;
         ctx.write = callback.write ;
       }
       else
       if ( typeof callback === 'function' )
       {
         ctx.write = callback ;
       }
     }
     if ( ! this.webSocket )
     {
       ctx.e = e ;
       this.pendingEventList.push ( ctx ) ;
     }
     var s = this.getSocket() ;
     if ( ! this.pendingEventList.length )
     {
       var uid = this.createUniqueEventId() ;
       e.setWebIdentifier ( uid ) ;
       this.callbacks[uid] = ctx ;
       var thiz = this ;
       s.send ( e.serialize() ) ;
     }
   };
   WebClient.prototype.addEventListener = function ( eventNameList, callback )
   {
     if ( ! eventNameList ) throw new Error ( "Client.addEventListener: Missing eventNameList." ) ;
     if ( typeof callback !== 'function' ) throw new Error ( "Client.addEventListener: callback must be a function." ) ;
     if ( typeof eventNameList === 'string' ) eventNameList = [ eventNameList ] ;
     if ( ! Array.isArray ( eventNameList ) )
     {
       throw new Error ( "Client.addEventListener: eventNameList must be a string or an array of strings." ) ;
     }
     if ( ! eventNameList.length )
     {
       throw new Error ( "Client.addEventListener: eventNameList must not be empty." ) ;
     }
     var e = new NEvent ( "system", "addEventListener" ) ;
     if ( this.user )
     {
       e.setUser ( this.user ) ;
     }
     e.data.eventNameList = eventNameList ;
     var i ;
     for ( i = 0 ; i < eventNameList.length ; i++ )
     {
       this.eventListenerFunctions.put ( eventNameList[i], callback ) ;
     }
     if ( ! this.webSocket )
     {
       this.pendingEventListenerList.push ( { e:e, callback:callback } ) ;
     }
     else
     if ( this.pendingEventListenerList.length )
     {
       this.pendingEventListenerList.push ( { e:e, callback:callback } ) ;
     }
     var s = this.getSocket() ;
     if ( ! this.pendingEventListenerList.length )
     {
       var uid = this.createUniqueEventId() ;
       e.setUniqueId ( uid ) ;
       e.setWebIdentifier ( uid ) ;
       s.send ( e.serialize() ) ;
     }
   };
   WebClient.prototype.removeEventListener = function ( eventNameOrFunction )
   {
     var i ;
     if ( typeof eventNameOrFunction === 'string' )
     {
       eventNameOrFunction = [ eventNameOrFunction ] ;
     }
     else
     if ( typeof eventNameOrFunction === 'function' )
     {
       eventNameOrFunction = [ eventNameOrFunction ] ;
     }
     else
     if ( Array.isArray ( eventNameOrFunction ) )
     {
     }
     else
     {
       throw new Error ( "Client.removeEventListener: eventNameOrFunction must be a function, a string or an array of strings." ) ;
     }

     var eventNameList = [] ;
     for ( i = 0 ; i < eventNameOrFunction.length  ; i++ )
     {
       var item = eventNameOrFunction[i] ;
       if ( typeof item === 'string' )
       {
         eventNameList.push ( item ) ;
         this.eventListenerFunctions.remove ( item ) ;
       }
       else
       if ( typeof item === 'function' )
       {
         var keys = this.eventListenerFunctions.getKeysOf ( item ) ;
         for ( i = 0 ; i < keys.length ; i++ )
         {
           eventNameList.push ( keys[i] ) ;
         }
         this.eventListenerFunctions.remove ( item ) ;
       }
       if ( ! eventNameList.length ) return ;
       var e = new NEvent ( "system", "removeEventListener" ) ;
       e.setUser ( this.user ) ;
       e.data.eventNameList = eventNameList ;
       var s = this.getSocket() ;
       s.send ( e.serialize() ) ;
     }
   };
   WebClient.prototype.sendResult = function ( message )
   {
     if ( ! message.isResultRequested() )
     {
       log ( "No result requested" ) ;
       log ( message ) ;
       return ;
     }
     message.setIsResult() ;
     this.webSocket.send ( message.serialize() ) ;
   };
   WebClient.prototype.splitJSONObjects = function ( str )
   {
     var list = [] ;
     var pcounter = 1 ;
     var q = "" ;
     var i0 = 0 ;
     var i = 1 ;
     for ( i = 1 ; i < str.length ; i++ )
     {
       var c = str.charAt ( i ) ;
       if ( c === '"' || c === "'" )
       {
         q = c ;
         for ( var j = i+1 ; i < str.length ; j++ )
         {
           c = str.charAt ( j ) ;
           if ( c === q )
           {
             if ( str.charAt  ( j - 1 ) === '\\' )
             {
               continue ;
             }
             i = j ;
             break ;
           }
         }
       }
       if ( c === '{' )
       {
         pcounter++ ;
         continue ;
       }
       if ( c === '}' )
       {
         pcounter-- ;
         if ( pcounter === 0 )
         {
           list.push ( str.substring ( i0, i + 1 ) ) ;
           i0 = i + 1 ;
           for ( ; i0 < str.length ; i0++ )
           {
             if ( str.charAt ( i0 ) === '{' )
             {
               i = i0 - 1 ;
               break ;
             }
           }
         }
         continue ;
       }
     }
     if ( i0 < str.length )
     {
       list.push ( str.substring ( i0 ) ) ;
     }
     return list ;
   };
   
   return WebClient ;
}