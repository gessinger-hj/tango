var util         = require ( "unwatchFile" ) ;
var Path         = require ( "path" ) ;
var fs           = require('fs');
var EventEmitter = require ( "events" ).EventEmitter ;

var Tail = function ( filename, options )
{
  EventEmitter.call ( this ) ;

  this.options = options ? options : {} ;
  this.filename = Path.resolve ( ( Path.normalize ( filename ) ) ) ;
  this.separator = options.separator ? options.separator : '\n' ;

  this.watcher = null ;

  this.watchIfNotExists = true ;
  this.buffer = '';
  this.fd = null;
  this.inode = 0;
  this.bookmarks = {};

};
util.inherits ( Tail, EventEmitter ) ;
Tail.prototype.watch = function()
{
  if ( this.watcher ) return ;
  
  if ( ! fs.existsSync ( this.filename ) )
  {
    if ( ! this.watchIfNotExists )
    {
      throw new Error ( "File does not exist: " + this.filename ) ;
    }
    var fname     = Path.basename ( this.filename ) ;
    var dname     = Path.dirname ( this.filename ) ;
    var thiz      = this ;
    var FSWatcher = fs.watch ( dname, function ( eventName, name )
    {
      if ( fname === name )
      {
        FSWatcher.close() ;
        thiz._init() ;
        thiz._watch() ;
      }
    });
  }
  else
  {
    this._init() ;
    this._watch() ;
  }
};
Tail.prototype._init = function()
{
  this.fd    = fs.openSync ( this.filename, 'r' ) ;
  var stat   = fs.statSync ( this.filename ) ;
  this.inode = stat.ino ; 
  this.mark  = 0;

  if ( typeof this.options.start !== 'number' )
  {
    this.options.start = stat.size - 512 ;
    if ( this.options.start < 0 ) this.options.start = 0 ;
  }

  if ( this.options.start && this.fd )
  {
    this.mark = this.options.start ;
  };
};
Tail.prototype._watch = function()
{
  var thiz = this ;
  this.watcher = fs.watch ( this.filename, function ( Xcurr, prev )
  {
    var stat = fs.statSync ( thiz.filename ) ;

    if ( stat.ino != thiz.inode )
    {
      thiz._close() ;
    }
  }
};

  Tail.prototype.readBlock = function()
  {
    var block, stream,
      self = this;

    var next = function() {

      if (block.type == 'close') {
        fs.close(block.fd);
        delete self.bookmarks[block.fd];
      };

      if (self.queue.length >= 1) { self.internalDispatcher.emit("next"); }
    };

    if (this.queue.length >= 1) {

      block = this.queue.shift();

      fs.fstat(block.fd, function(err, stat) {

        if (err) { return next(); };

        var start = self.bookmarks[block.fd];
        var end = stat.size;
  
        if (end < start) {
          // file was truncated
          // debug('file was truncated:', self.filename);
          start = 0;
        };

        var size = end - start;
        if (size == 0) return next(); // no data.

        var buffer = new Buffer(size);

        // debug("reading:", block.fd, size, start);
        fs.read(block.fd, buffer, 0, size, start, function(err, bytesRead, buff) {
          var chunk, parts, _i, _len, _results;

          if (err) { return self.emit('error', err); };

          if (bytesRead == 0) { return next() };

          self.bookmarks[block.fd] += bytesRead;
          buff = buff.toString("utf-8");
          self.buffer += buff;
          parts = self.buffer.split(self.separator);
          self.buffer = parts.pop();

          for (_i = 0, _len = parts.length; _i < _len; _i++) {
            self.emit ( "line", parts[_i] ) ;
          }
          next();
        });
      });
    }
  };
Tail.prototype.unwatch = function()
{
  if ( this.watcher )
  {
    this.watcher.close() ;
    this.watcher = null ;
  };
  
  this._close() ;
};
Tail.prototype._close = function()
{
  if ( ! this.fd ) return ; 
  fs.close ( this.fd ) ;
  this.fd = null;
  this.mark = 0 ;
};

module.exports = XTail;
