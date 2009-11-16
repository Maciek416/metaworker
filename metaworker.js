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
onmessage = function(event) {  
	var payload = event.data;
	payload.func = eval("(" + payload.func + ")");
	postMessage({
		type: 'data',
		payload: payload.func.apply(this,payload.args)
	});
};