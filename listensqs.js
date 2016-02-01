var Consumer = require('sqs-consumer');
var dynamodbfile = require('./dynamodb');

var appSQS = Consumer.create({
    queueUrl: 'https://sqs.us-east-1.amazonaws.com/060340690398/CMPE281-Team11-new-shortlinks',
    region: 'us-east-1',
    batchSize: 10,
    handleMessage: function (message, done) {

        var msgBody = JSON.parse(message.Body);
        console.log(msgBody);
		
		setToRedis(msgBody);
		//getFromRedis(msgBody.shorturl);
		//delOneRedis(msgBody.shorturl); 
        //getFromRedis(msgBody.shorturl);
		dynamodbfile.putIntoDynamodbForIPCreation(msgBody.shorturl);
        return done();

    }
});

appSQS.on('error', function (err) {
    console.log(err);
});

appSQS.start();


//redis 
var AWS = require("aws-sdk");
var elasticache = new AWS.ElastiCache();

// AWS.config.region = "us-east-1d";
AWS.config.apiVersions = {
    rds: '2015-02-02',
};

var redis = require('redis');
var client = redis.createClient(6379, 
    'redis.amb3uo.0001.use1.cache.amazonaws.com', {no_ready_check: true});

client.on("error", function (err) {
    console.log("Error " + err);
});


function setToRedis(jsonObj) {
	client.set(jsonObj.shorturl, jsonObj.originurl, redis.print); 
};

function getFromRedis(shorturl) {
    client.get(shorturl, function (err, reply) {
		if(err) {
			console.log("Can not find record in Redis!");
		};
		if(reply != null)
        	console.log(reply.toString());
    });
};

function delOneRedis(shorturl) {
	client.del(shorturl,  function(err, o) {
		console.log("One record in redis has been deleted.");
	});
};
