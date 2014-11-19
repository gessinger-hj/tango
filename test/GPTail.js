var T = require ( 'Tango' ) ;
var Tail = require ( './Tail' ) ;
var Event = require ( 'gp/Event' ) ;
var Client = require ( 'gp/Client' ) ;

var index = -1 ;

fileName = T.getProperty ( "file" ) ;

var _fileList = [ "/home/gess/work/poi-3.8/ServiceContainer.ACS.log_1"
								, "/home/isdp/isdp-server/log/isdp-ciss.log_1"
								, "/home/gess/NGMD/Test/Converter.log"
								];

index = 2 ;

var client = new Client() ;

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

var what = T.getProperty ( "getFileList" ) ;
if ( what )
{
	client.request ( "tail:getFileList"
, function result(e)
  {
    T.log ( e.data.fileList ) ;
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
	client.request ( { name: "tail:subscribe", type: index }
	, function result(e)
	  {
	    if ( e.isBad() )
	    {
	    	this.end() ;
	    	return ;
	    }
	    // console.log ( "tail of " + e.type + " accepted!" ) ;
	    var n = 0 ;
	    client.on ( "tail:" + _fileList[index], function subscribed_callback(e)
	    {
T.lwhere (  ) ;
				console.log ( e.data.text ) ;
T.lwhere (  ) ;
	    } )
	  }
	);
T.lwhere (  ) ;
	return ;
}

var _TailList = [] ;
var _FileToTail = {} ;
client.on ( "tail:getFileList", function getFileList ( e )
{
	e.data.fileList = _fileList ;
  this.sendResult ( e ) ;
} ) ;
client.on ( "tail:subscribe", function subscribe ( e )
{
	var index = e.type ;
	if ( isNaN ( index ) || index < 0 || index >= _fileList.length )
	{
		var s = "subscribe: invalid index=" + index ;
		console.error ( s ) ;
    e.control.status = { code:1, name:"error", reason: s } ;
  	this.sendResult ( e ) ;
  	return ;
	}
	var fn = _fileList[index] ;
  e.control.status = { code:0, name:"ack", reason: fn } ;
  // e.setType ( fn ) ;
	this.sendResult ( e ) ;
	if ( _FileToTail[fn] )
	{
		return ;		
	}
	var tail = new Tail ( fn ) ;
	_TailList.push ( tail ) ;
	_FileToTail[fn] = tail ;
	tail.on ( "line", function online ( data )
	{
		var e = new Event ( "tail:" + tail.getFileName() ) ;
		e.setFailureInfoRequested() ;
		e.data.text = data.toString() ;
		client.fire ( e, function failure(e)
		{
			console.log ( tail.getFileName() + " ended!" ) ;
			tail.unwatch() ;
			delete _FileToTail[tail.getFileName()] ;
			_TailList.remove ( this ) ;
		} ) ;
	} );
	tail.watch();
} ) ;
// tail.on('error', function(data) {
//   console.log("error:", data);
// 	tail.unwatch();
// });
