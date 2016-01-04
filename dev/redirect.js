var fs = require('fs');

process.on('exit', function(code) {
  console.log('About to exit with code:', code);
});
    console.log('console.log pre-redirect');
    console.error('console.error pre-redirect');
    process.stdout.write('process.stdout.write pre-redirect\n');
    process.stderr.write('process.stderr.write pre-redirect\n\n');

    var oldout = process.stdout;
    var olderr = process.stderr;

    var stderr, stdout ;
    stdout = stderr = fs.createWriteStream('file.log');
    process.__defineGetter__("stdout", function(){
        return stdout;
    });
    process.__defineGetter__("stderr", function(){
        return stderr;
    });
    // process.stdout = process.stderr = fs.createWriteStream('file.log');

    console.log('console.log redirected');
    console.error('console.error redirected');
    process.stdout.write('process.stdout.write redirected\n');
    process.stderr.write('process.stderr.write redirected\n\n');

    // process.stdout = oldout;
    // process.stderr = olderr;
    process.__defineGetter__("stdout", function(){
        return oldout;
    });
    process.__defineGetter__("stderr", function(){
        return olderr;
    });
    console.log('console.log un-redirected');
    console.error('console.error un-redirected');
    process.stdout.write('process.stdout.write un-redirected\n');
    process.stderr.write('process.stderr.write un-redirected\n\n');

require('util').log('Timestamped message.');
