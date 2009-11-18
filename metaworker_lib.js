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
//
//
//  * wait until after the creation loop to actually -start- the workers. oops ?
//
//
//
//  * we need an example that does word counts
//  * allow user to control number of simultaneous threads
//  * allow user to force reduction to happen in a worker
//  * rewrite fractal example to use above option
//  * make getMoreWorkers not be recursive
//  * don't wait until number of workers is 0 before spawning more workers, keep the worker count steady
//

var metaworker = function(options){

	var debuggingEnabled = options.debug;
	var path = "";
	var activeMappers = 0;
	var maxMappers = 2;
	var partitionSize = options.partitionSize;

	// this allows us to place metaworker.js in some arbitrary path
	// note that the path we pass in must end in '/' since metaworker
	// will simply add the strings blindly.
	if(typeof(options.workerpath)=='string' || options.workerpath instanceof String){
		path = options.workerpath;
	}

	// onIntermediateResults is a function that can be used to peek
	// at intermediate results before they are passed to the reducer
	// function. This allows for progress indicators to be updated, 
	// or for graphics to be rendered.
	if(typeof(options.onIntermediateResults)!='function'){
		options.onIntermediateResults = null;
	}

	if(typeof(options.partitionSize)!='number'){
		// fudge a default partition size
		partitionSize = Math.min((maxMappers * maxMappers), options.work.length);
	} else {
		// don't allow partitions to be smaller than the work size
		partitionSize = Math.min(partitionSize, options.work.length);
	}

	// don't parallelize if the work is too small
	if(options.parallel==true && options.work.length <= partitionSize){
		options.parallel = false;
	}


	// startWorkerPool takes a list of workers and starts them up
	var startWorkerPool = function(workers){
		if(debuggingEnabled==true) {
			console.log("Starting up ",workers.length," workers.");
		}
		for(var i=0;i<workers.length;i++){
			workers[i].start();
		}
	};

	var worker = new Worker(path + "metaworker.js");

	// receive a message from our worker. Messages can either be logging or callback
	worker.onmessage = function(event) {
		var callbackData = event.data;
		if(callbackData.type=='data'){
			options.callback(callbackData.payload);
		} else if(({'log':true,'debug':true,'dir':true}).hasOwnProperty(callbackData.type)){
			if(debuggingEnabled==true) {
				if(window.console.log && window.console.debug && window.console.dir){
					console[callbackData.type].apply(this,callbackData.payload);
				}
			}
		}
		worker.terminate();
	};

	worker.onerror = function(error) {
		if(typeof(options.error)=='function'){
			if(debuggingEnabled==true) {
				console.error("metaworker failed to complete work and returned an error:",error);
			}
			options.error(error.message);
		}
		worker.terminate();
	};

	//
	// We can run a worker in two modes: 
	// 1) parallel, in which case the work is partitioned and multiple workers
	//    are likely to be spawned to run at the same time.
	// 2) normal, in which case a worker simply runs and returns 
	//
	if(options.parallel==true){
		var chunks = [];

		// validate partition size
		if(typeof(partitionSize)!='number' || partitionSize<=0){
			throw "Invalid partition size of ["+partitionSize+"] specified";
		}

		// Partition the work into partitionSize'd chunks. The last one might
		// be equal to or smaller than partitionSize
		while(options.work.length > 0){
			chunks.push(options.work.splice(0,partitionSize));
		}

		if(debuggingEnabled==true) {
			console.log("Partition size:",partitionSize);
			console.log("Number of work chunks to complete:",chunks.length);
		}

		var currentChunk = 0;
		var numTotalChunks = chunks.length;
		var numReturnedChunks = 0;
		var reducedChunks = [];

		// Return a pool of worker objects which are waiting to start processing
		// via the start() method
		var getMoreWorkers = function(){
			var workerPool = [];

			for(var i=0;i<maxMappers;i++){
				
				if(chunks.length == 0){
					if(debuggingEnabled==true) {
						console.log("Completed all work chunks, no work left.");
					}
					break;
				}
			
				// TODO: is biting off pieces of the array like this the best idea?
				var nextWorkChunk = (chunks.splice(0,1))[0];

				if(nextWorkChunk.length > 0){
					(function(chunk){
						var chunkIndex = Math.round(Math.random()*10000000);

						// spawn a sub-worker to process this chunk
						if(debuggingEnabled==true) {
							console.log("Spawning mapper #"+chunkIndex);
						}

						workerPool.push(
							metaworker({
								mapper: options.mapper,
								work: chunk,
								callback: function(result){
									if(debuggingEnabled==true) {
										console.log("Mapper #"+chunkIndex+" has returned data");
									}

									numReturnedChunks++;

									//
									// Allow user code to peek at intermediate results and render any progress
									// indicators or graphics (i.e. for iterative renderers)
									//
									if(typeof(options.onIntermediateResults)=='function'){
										options.onIntermediateResults([result]);
									}

									//
									// Combine intermediate results with existing results
									//
									if(debuggingEnabled==true) {
										console.log("Reducing..");
									}
									reducedChunks = options.reducer(reducedChunks,[result]);

									activeMappers--;

									//
									// Check if we're finished the entire work set. if yes, stop
									// spawning more workers and call the user's callback function.
									//
									if(debuggingEnabled==true) {
										console.log("Processed ",numReturnedChunks," / ",numTotalChunks," work chunks.");
									}

									//
									// Are we finished processing all the data? If so, call the user's callback
									//
									if(numReturnedChunks==numTotalChunks){
										options.callback(reducedChunks);
									} else {
										// if we're not done yet and we've run out of workers, spawn more workers
										if(activeMappers==0){
											if(debuggingEnabled==true) {
												console.log("Expended worker pool, spawning new workers");
											}
											var workerPool = getMoreWorkers();
											startWorkerPool(workerPool);
										}
									}

									if(debuggingEnabled==true) {
										console.log("active mappers:",activeMappers);
									}
								}
							})
						);
					})(nextWorkChunk);
				} else {
					if(debuggingEnabled==true) {
						console.log("next work chunk is empty, stopping");
					}
				}

				// keep track of how many mapper workers we have in action so we can track when we're done
				// TODO: if a mapper crashes and returns an error, this count is not decremented,
				//       which will likely cause a bug. Fix this.
				activeMappers++;
			}
			return workerPool;
		};
		
		var workerPool = getMoreWorkers();
		
	} else {
		
		// In non-parallel mode all we do is create a worker and exit.
		var f = options.mapper;
		worker.postMessage({
			type:'payload',
			func:(f.toSource ? f.toSource( ): f.toString()),
			args:[options.work]
		});
	}
	
	return {
		start:function(){
			if(options.parallel){
				startWorkerPool(workerPool);
			} else {
				worker.postMessage({
					type:'start'
				});
			}
		}
	};
};