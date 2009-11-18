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