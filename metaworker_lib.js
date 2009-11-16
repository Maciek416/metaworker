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
// TODO:
//
//  * make only a small number of threads execute at a time, and have a dispatcher assign work
//  * we need an example that does word counts
//  * allow user to control number of simultaneous threads
//  * allow user to control work chunk size
//  * allow user to force reduction to happen in a worker
//  * allow user to peek at intermediate data and output to foreground browser thread (for progress showing / visual rendering)
//  * rewrite fractal example to use above option
//  * make doMoreWork not be recursive
//  * don't wait until number of workers is 0 before spawning more workers, keep the worker count steady
//  * turn off debugging except in debug mode
//


var metaworker = function(options){
	var path = "";
	var activeSubworkers = 0;

	if(typeof(options.workerpath)=='string' || options.workerpath instanceof String){
		path = options.workerpath;
	}

	var worker = new Worker(path + "metaworker.js");

	worker.onmessage = function(event) {
		var callbackData = event.data;
		if(callbackData.type=='data'){
			options.callback(callbackData.payload);
		} else if(({'log':true,'debug':true,'dir':true}).hasOwnProperty(callbackData.type)){
			console[callbackData.type].apply(this,callbackData.payload);
		}
		worker.terminate();
	};

	worker.onerror = function(error) {
		if(typeof(options.error)=='function'){
			options.error(error.message);
		}
		worker.terminate();
	};

	var num_workers = 8;
	var slice_size = Math.min((num_workers * num_workers), options.work.length);
	console.log("slice_size",slice_size);

	// don't parallelize if the work is too small
	if(options.parallel==true && options.work.length <= slice_size){
		options.parallel = false;
	}

	if(options.parallel==true){
		var chunks = [];
		while(options.work.length > 0){
			chunks.push(options.work.splice(0,slice_size));
		}

		var finished = false;
		var numTotalChunks = chunks.length;
		var numReturnedChunks = 0;
		var reducedChunks = [];
		
		var doMoreWork = function(){
			for(var i=0;i<num_workers;i++){
				var nextWorkChunk = (chunks.splice(0,1))[0];
				(function(chunk){
					var chunkIndex = Math.round(Math.random()*10000000);
					// spawn a sub-worker to process this chunk
					console.log("Spawning worker #"+chunkIndex);
					metaworker({
						mapper: options.mapper,
						work: chunk,
						callback: function(result){
							console.log("Worker #"+chunkIndex+" has returned data");

							numReturnedChunks++;

							// combine intermediate results with existing results
							console.log("Sending new results to be reduced with existing intermediate results");
							reducedChunks = options.reducer(reducedChunks,[result]);

							activeSubworkers--;

							// Check if we're finished the entire work set. if yes, stop
							// spawning more workers and call the user's callback function.
							if(numReturnedChunks==numTotalChunks){
								options.callback(reducedChunks);
							} else {
								// if we're not done yet and we've run out of workers, spawn more workers
								if(activeSubworkers==0){
									doMoreWork();
								}
							}

							console.log("active workers:",activeSubworkers);
						}
					});
				})(nextWorkChunk);

				activeSubworkers++;
			}
		};
		
		doMoreWork();
		
	} else {
		var f = options.mapper;
		worker.postMessage({
			func:(f.toSource ? f.toSource( ): f.toString()),
			args:[options.work]
		});
	}
};