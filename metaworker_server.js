// 
// metaworker v0.1
// Copyright (c) 2009 Maciej Adwent, http://buildingsky.net/
//  
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//  
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//  
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
//


//
// metaworker / node.js worker unit - Example server
//
// This is an example server which can serve up the fractal_example and process work units
// on the back end instead of the front end.
//

var sys = require('sys');
var http = require('http');
var posix = require('posix');

var console = {
	log: function(){},
	debug: function(){},
	dir: function(){}
};

var serveFile = function(filename, res, contenttype){
	posix.stat(filename).addCallback(function (stats) {
		posix.open(filename, process.O_RDONLY, 0666).addCallback(function (fd) {
			posix.read(fd, stats.size, 0).addCallback(function(body){
				res.sendHeader(200, {"Content-Length": body.length,"Content-Type": contenttype});
				res.sendBody(body);
				res.finish();
			});
		});
	});
};

var isAFileRequest = function(filepath){
	return filepath.indexOf("/")==0 && allowedFiles[filepath.split("/")[1]] == true;
};

var repeatStr = function(str,x){
	var result = "";
	for(var i=0;i<=x;i++){
		result = result + str;
	}
	return result;
};

var contentType = function(filename){
	return ({
		"js":"text/javascript",
		"json":"application/json",
		"html":"text/html"
	})[filename.split(".")[1]];
};

var allowedFiles = {
	'metaworker_lib.js':true,
	'metaworker.js':true,
	'fractal_example.html':true,
	'index.html':true
};

var workerUnitCount = 0;

http.createServer(function (req, res) {

	if(req.uri.path=="/"){
		req.uri.path = "/index.html";
	}

	if (isAFileRequest(req.uri.path)){

		//
		// Serve a static file
		//
		var filename = req.uri.path.split("/")[1];
		return serveFile(filename, res, contentType(filename));

	} else if (req.uri.path == "/metaworker.json") {
		workerUnitCount++;

		var d1 = new Date();
		var startTime = d1.getTime();

		//
		// Complete a metaworker work unit
		//
		var payload = JSON.parse(req.uri.params.payload);
		var func = eval("(" + payload.func + ")");
		sys.puts("Completing work unit "+workerUnitCount);
		var result = func.apply(this,payload.args);
		var body = JSON.stringify(result);
		res.sendHeader(200, {"Content-Length": body.length, "Content-Type": "application/json"});
		res.sendBody(body);
		res.finish();

		var d2 = new Date();
		var endTime = d2.getTime();
		sys.puts("Completed work unit "+workerUnitCount+" in "+(d2-d1)+"ms");

	} else {

		//
		// 404
		//
		var body = "metaworker - invalid request";
		res.sendHeader(404, {"Content-Length": body.length,"Content-Type": "text/html"});
		res.sendBody(body);
		res.finish();

	}

}).listen(8000);

sys.puts('Server running at http://127.0.0.1:8000/');