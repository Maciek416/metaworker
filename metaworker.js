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


// provide pass-thru console support
var console = {
	log: function(){
		var args = [];
		for(var i=0;i<arguments.length;i++){
			args.push(arguments[i]);
		}
		postMessage({ type:'log', payload:args });
	},
	debug: function(){
		var args = [];
		for(var i=0;i<arguments.length;i++){
			args.push(arguments[i]);
		}
		postMessage({ type:'debug', payload:args });
	},
	dir: function(){
		var args = [];
		for(var i=0;i<arguments.length;i++){
			args.push(arguments[i]);
		}
		postMessage({ type:'dir', payload:args });
	}
};

var payload;

//
// A metaworker can receive two types of messages:
//
// 1) A payload transmission - this is the work to be done and the
//    function that will be applied to the work.
// 2) A start signal - this causes the worker to execute the payload
//    from the first message.
//
// TODO: put in messaging and error handling
//
onmessage = function(event) {
	if(event.data.type=='payload'){
		payload = event.data;
	} else if (event.data.type=='start'){
		var func = eval("(" + payload.func + ")");
		postMessage({
			type: 'data',
			payload: func.apply(this,payload.args)
		});
	}
};