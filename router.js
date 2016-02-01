	var logic = require('./logic');
	var dynamodbfile = require('./dynamodb');
	var redisfile = require('./redis');
	
	var route = function(app){
		app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
		app.get('/add', function(request, response){
			var url = request.param('url');
			var vanity = request.param('vanity');
			logic.addUrl(url, request, response, vanity);
		});
		
		app.get('/whatis', function(request, response){
			var url = request.param('url');
			logic.whatIs(url, request, response);
		});

		app.get('/healthcheck', function(request, response){
			response.send("OK");
		});
		
		
		app.get('/stats', function(request, response) {
			//logic.getStats(request.param('segment'), request, response); // get  statistic result from sql
			dynamodbfile.getStats(request.param('segment'), request, response); //get statistic result from dynamodb
			// console.log("router is working\n");
		});
		//end
		
		app.get('/:segment', function(request, response){
			
			redisfile.getUrl(request.params.segment, request, response, logic.getUrl);// from redis, if not found, callback from mysql
			
			
			//logic.getUrl(request.params.segment, request, response); //from mysql
			
						
			dynamodbfile.setStats(request.params.segment, request, response); // send client info to dynamodb 
		});

		
	}

	exports.route = route;