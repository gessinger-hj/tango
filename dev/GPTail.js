
var T      = require ( 'Tango' ) ;
var Tail   = require ( './Tail' ) ;
var File   = require ( 'File' ) ;
var Event  = require ( 'Event' ) ;
var Client = require ( 'Client' ) ;
var Admin  = require ( 'Admin' ) ;


var index = -1 ;

if ( T.getProperty ( "help" ) )
{
	usage() ;
}
fileName = T.getProperty ( "file" ) ;

// var _fileList = [ "/home/gess/work/poi-3.8/ServiceContainer.ACS.log_1"
// 								, "/home/isdp/isdp-server/log/isdp-ciss.log_1"
// 								, "/home/gess/NGMD/Test/Converter.log"
// 								];
var _List1 = [ "/home/gess/kepler/private/log/KaLog.log_1"
						 , "/home/gess/kepler/private/log/Kaiso.log_1"
						 ];
var _List2 = [ "/home/gess/work/poi-3.8/ServiceContainer.ACS.log_1"
						 , "/home/isdp/isdp-server/log/isdp-ciss.log_1"
						 , "/home/gess/NGMD/Test/Converter.log"
						 ];
var listFile = new File ( __dirname, "GPTail.json" ) ;
var _fileList = _List1 ;
if ( listFile.exists() )
{
	_fileList = listFile.getJSON() ;
}

index = 0 ;
var fileName = T.getProperty ( "file" ) ;
if ( fileName )
{
	var i = _fileList.indexOf ( fileName ) ;
	if ( i < 0 )
	{
		_fileList.push ( fileName ) ;
		index = _fileList.length - 1 ;
	}
}
var client = new Client() ;

var what = T.getProperty ( "getFileList" ) ;
if ( what )
{
	client.request ( "tail:getFileList"
, function result(e)
  {
  	if ( e.isBad() )
  	{
  		console.log ( e.control.status ) ;
  	}
  	else
  	{
	    T.log ( e.body.fileList ) ;
  	}
    this.end() ;
  });
	return ;
}
what = T.getProperty ( "reloadFileList" ) ;
if ( what )
{
	client.request ( "tail:reloadFileList"
, function result(e)
  {
  	if ( e.isBad() )
  	{
  		console.log ( e.control.status ) ;
  	}
  	else
  	{
	    T.log ( e.body.fileList ) ;
  	}
    this.end() ;
  });
	return ;
}
what = T.getProperty ( "info" ) ;
if ( what )
{
	client.request ( "tail:info"
, function result(e)
  {
  	if ( e.isBad() )
  	{
  		console.log ( e.control.status ) ;
  	}
  	else
  	{
	    T.log ( e.body.info ) ;
  	}
    this.end() ;
  });
	return ;
}
what = T.getProperty ( "closeAll" ) ;
if ( what )
{
	client.fire ( "tail:closeAll"
	, function write(e)
	  {
	    this.end() ;
	  });
	return ;
}
what = T.getProperty ( "subscribe" ) ;
if ( what )
{
	index = parseInt ( what ) ;
	if ( isNaN ( index ) || index < 0 || index >= _fileList.length )
	{
		console.error ( T.where() + " subscribe: invalid index=" + index ) ;
		return ;
	}
  var subscribed_callback = function(e)
  {
		console.log ( e.body.text ) ;
  } ;
  client.on ( "tail:" + _fileList[index], subscribed_callback ) ;

	client.request ( { name: "tail:subscribe", type: _fileList[index] }
	, function result(e)
	  {
	    if ( e.isBad() )
	    {
				console.log ( e.control.status ) ;
	    	client.removeEventListener ( subscribed_callback ) ;
	    	this.end() ;
	    	return ;
	    }
	  }
	);
	return ;
}
what = T.getProperty ( "unsubscribe" ) ;
if ( what )
{
	index = parseInt ( what ) ;
	if ( isNaN ( index ) || index < 0 || index >= _fileList.length )
	{
		console.error ( T.where() + " unsubscribe: invalid index=" + index ) ;
		return ;
	}
	client.request ( { name: "tail:unsubscribe", type: _fileList[index] }
	, function result(e)
	  {
			console.log ( e.control.status ) ;
    	this.end() ;
    	return ;
	  }
	);
	return ;
}
function usage ( t )
{
	if ( t )
	{
		console.log ( t ) ;
		console.log () ;
	}
	var s = "GPTail: publish tail services for various files."
				+ "\nUsage: node GPTail -DoptionName[=value]"
				+	"\nOptions are:"
				+	"\n  publish:        connect and publish"
				+	"\n  closeAll:       close all currently active tail activities."
				+	"\n  info:           list all active watches."
				+	"\n  getFileList:    list the configured list of files."
				+	"\n  reloadFileList: reload the file GPTail.json."
				;
	console.log ( s ) ;
	process.exit ( 0 ) ;
}
function publish()
{
	var _SubscriptionList = [] ;
	var _Subscriptions = {} ;
	client.on ( "tail:closeAll", function closeAll ( e )
	{
		for ( var i = 0 ; i < _SubscriptionList.length ; i++ )
		{
			_SubscriptionList[i].tail.unwatch() ;
		}
		_SubscriptionList.length = 0 ;
		_Subscriptions = {} ;
	} ) ;
	client.on ( "tail:info", function info ( e )
	{
		var tailList = [] ;
		for ( var i = 0 ; i < _SubscriptionList.length ; i++ )
		{
			tailList.push ( _SubscriptionList[i].tail.getFileName() ) ;
		}
		e.body.info = {} ;
		e.body.info.tailList = tailList ;
		e.body.info.fileList = _fileList ;
	  this.sendResult ( e ) ;
	} ) ;
	client.on ( "tail:getFileList", function getFileList ( e )
	{
		e.body.fileList = _fileList ;
	  this.sendResult ( e ) ;
	} ) ;
	client.on ( "tail:reloadFileList", function reloadFileList ( e )
	{
		var f = new File ( __dirname, "GPTail.json" ) ;
		try
		{
			_fileList = f.getJSON() ;
		}
		catch ( exc )
		{
			console.log ( exc ) ;
		}
		e.body.fileList = _fileList ;
	  this.sendResult ( e ) ;
	} ) ;
	client.on ( "tail:unsubscribe", function unsubscribe ( e )
	{
		var fn = e.type ;
		var ctx = _Subscriptions[fn] ;
		if ( ctx )
		{
			ctx.counter-- ;
			if ( ctx.counter <= 0 )
			{
				ctx.tail.ended = true ;
				ctx.tail.unwatch() ;
				_SubscriptionList.remove ( ctx ) ;
				delete _Subscriptions[fn] ;
			}
	  	e.control.status = { code:0, name:"ack", reason: "unsubscribed: " + fn } ;
		}
		else
		{
	  	e.control.status = { code:1, name:"warning", reason: "no subscription for: " + fn } ;
		}
	  this.sendResult ( e ) ;
	}) ;
	client.on ( "tail:subscribe", function subscribe ( e )
	{
		var fn = e.type ;
		var index = _fileList.indexOf ( fn ) ;
		if ( index < 0 )
		{
			var s = "subscribe: invalid subscription target=" + fn ;
			console.error ( s ) ;
	    e.control.status = { code:1, name:"error", reason: s } ;
	  	this.sendResult ( e ) ;
	  	return ;
		}
	  e.control.status = { code:0, name:"ack", reason: fn } ;
	  // e.setType ( fn ) ;
		this.sendResult ( e ) ;
		if ( _Subscriptions[fn] )
		{
			_Subscriptions[fn].counter++ ;
			return ;		
		}
		var tail = new Tail ( fn ) ;
		tail.on ( 'error', function ( data )
		{
		  console.log("error:", data);
			var ctx = _Subscriptions[tail.getFileName()] ;
			ctx.tail.ended = true ;
			ctx.tail.unwatch() ;
			_SubscriptionList.remove ( ctx ) ;
			delete _Subscriptions[tail.getFileName()] ;
		});
		var ctx = { file: fn, tail: tail, counter: 1 } ;
		_SubscriptionList.push ( ctx ) ;
		_Subscriptions[fn] = ctx ;
		tail.on ( "line", function online ( data )
		{
			if ( tail.ended )
			{
				return ;
			}
			var e = new Event ( "tail:" + tail.getFileName() ) ;
			e.setFailureInfoRequested() ;
			e.body.text = data.toString() ;
			client.fire ( e, function failure(e)
			{
				if ( tail.ended )
				{
					return ;
				}
				console.log ( tail.getFileName() + " ended!" ) ;
				var ctx = _Subscriptions[tail.getFileName()] ;
				ctx.tail.ended = true ;
				ctx.tail.unwatch() ;
				_SubscriptionList.remove ( ctx ) ;
				delete _Subscriptions[tail.getFileName()] ;
			} ) ;
		} );
	} ) ;
	client.on ( "end", function onend()
	{
		for ( var i = 0 ; i < _SubscriptionList.length ; i++ )
		{
			_SubscriptionList[i].tail.unwatch() ;
		}
		_SubscriptionList.length = 0 ;
		_Subscriptions = {} ;
	});
	client.on ( "error", function onend()
	{
		for ( var i = 0 ; i < _SubscriptionList.length ; i++ )
		{
			_SubscriptionList[i].tail.unwatch() ;
		}
		_SubscriptionList.length = 0 ;
		_Subscriptions           = {} ;
	});
}
what = T.getProperty ( "publish" ) ;
if ( what )
{
	new Admin().getNumberOfApplications ( "GPTail", function getNumberOfApplications ( n )
	{
		if ( n >= 1 )
		{
			console.log ( "GPTail is already running" ) ;
			return ;
		}
		publish() ;
	} ) ;
	return ;
}

usage ( "Missing or invalid option" ) ;
