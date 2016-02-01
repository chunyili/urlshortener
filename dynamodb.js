var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
  endpoint: "dynamodb.us-east-1.amazonaws.com"
});

var dynamodbDoc = new AWS.DynamoDB.DocumentClient();

var table = "281_team11";

//updateDynamodb("www.try", '1.1.1.1');
//putIntoDynamodb("www.try", '2.2.2.2');
//queryDynamodb("www.try");


function putIntoDynamodbForIPCreation(shorturl) {
	
	var ipset=[];
	var params = {
	    TableName:table,
	    Item:{
			"url_short": shorturl,
	        "counts": 0,
			"rows": ipset
	    }
	};

	console.log("Adding a new item...");
	dynamodbDoc.put(params, function(err, data) {
	    if (err) {
	        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
	    } else {
	        console.log("Added item:", JSON.stringify(data, null, 2));
	    }
	});
};




function putIntoDynamodb(shorturl, ip_address) {
	var d = new Date();
	var utc = d.getTime() + (d.getTimezoneOffset()  * 60000);
	var time = new Date(utc + (3600000 * -8));
	time = String(time);
	time = time.split(" GMT", 1);
	console.log(time);
	
	var ipset=[];
	var ip_row = {
					  "clickdate": String(time), 
					   "ip": ip_address
	             };
	ipset.push(ip_row)
	console.log(ip_row);
	console.log(ipset);
	var params = {
	    TableName:table,
	    Item:{
			"url_short": shorturl,
	        "counts": 1,
			"rows": ipset
	    }
	};

	console.log("Adding a new item...");
	dynamodbDoc.put(params, function(err, data) {
	    if (err) {
	        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
	    } else {
	        console.log("Added item:", JSON.stringify(data, null, 2));
	    }
	});
};

function updateDynamodb(shorturl, ip_address) {
	var d = new Date();
	var utc = d.getTime() + (d.getTimezoneOffset()  * 60000);
	var time = new Date(utc + (3600000 * -8));
	time = String(time);
	time = time.split(" GMT", 1);
	console.log(time);
	
	var ipset=[];
	var ip_row = {
					   "clickdate": String(time), 
					   "ip": ip_address
	             };
	ipset.push(ip_row)
	
	
	var params = {
	    TableName:table,
		Key : {"url_short": shorturl},
	    AttributeUpdates: {
	        "counts": {
				Action: 'ADD',
				Value: 1
	        },
			
	        "rows": {
				Action: 'ADD',
				Value: ipset
			}
			
	    }
	};

	console.log("Updating a new item...");
	dynamodbDoc.update(params, function(err, data) {
	    if (err) {
	        console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
	    } else {
	        console.log("Added item:", JSON.stringify(data, null, 2));
	    }
	});
};

function queryDynamodb(shorturl) {
	var params = {
	    TableName: table,
	    KeyConditionExpression: "#url = :value",
	    ExpressionAttributeNames:{
	        "#url": "url_short"
	    },
	    ExpressionAttributeValues: {
	        ":value": shorturl
	    }
		
	};

	console.log("Querying a item...");
	dynamodbDoc.query(params, function(err, data) {
	    if (err) {
	        console.error("Unable to query item. Error JSON:", JSON.stringify(err, null, 2));
	    } else {
	        console.log("query item:", data);
			console.log(data.Items[0].url_short);
			console.log(data.Items[0].ip);
			console.log(data.Items[0].click_times);
	    }
	});
};

//This function returns the correct IP address. Node.js apps normally run behind a proxy, so the remoteAddress will be equal to the proxy. A proxy sends a header "X-Forwarded-For", so if this header is set, this IP address will be used.
function getIP(request){
	return request.header("x-forwarded-for") || request.connection.remoteAddress;
};

function getStats(shorturl, request, response) {
	var params = {
	    TableName: table,
	    KeyConditionExpression: "#url = :value",
	    ExpressionAttributeNames:{
	        "#url": "url_short"
	    },
	    ExpressionAttributeValues: {
	        ":value": shorturl
	    }
		
	};

	console.log("Querying a item...");
	dynamodbDoc.query(params, function(err, data) {
	    if (err) {
	        //console.error("Unable to query item. Error JSON:", JSON.stringify(err, null, 2));
			console.log("From getStats() in dynamodb get_query returns 0 rows..");
			response.send({result: false, errorCode: 1});
	    } else {
	        console.log("query item:", data);
			if(data.Count == 0) {
				console.log("From getStats() in dynamodb get_query returns 0 rows..");
				response.send({result: false, errorCode: 1});
			} 
			else {
				resultSet ={
					"result": true,
					"rows": data.Items[0].rows,
					"counts": data.Items[0].counts
				};
				response.send(resultSet);
				console.log("From getStats() in dynamodb " + data.Items[0].counts + " records returned..");
			}

	    }
	});
};

function setStats(shorturl, request, response) {
	var params = {
	    TableName: table,
	    KeyConditionExpression: "#url = :value",
	    ExpressionAttributeNames:{
	        "#url": "url_short"
	    },
	    ExpressionAttributeValues: {
	        ":value": shorturl
	    }
		
	};
	
	//query dynamodb if url exits (count>0) update, if not(count=0) insert
	dynamodbDoc.query(params, function(err, data) {
	    if (err) {
	        console.error("Unable to query item. Error JSON:", JSON.stringify(err, null, 2));
	    } else {
	        console.log("query item:", data);
			if(data.Count == 0) {
				console.log("Putinto dynamodb");
				putIntoDynamodb(shorturl, getIP(request));
			} 
			else {
				console.log("Update dynamodb");
				updateDynamodb(shorturl, getIP(request));
			}

	    }
	});
	
};

exports.getStats = getStats;
exports.setStats = setStats;
exports.putIntoDynamodbForIPCreation = putIntoDynamodbForIPCreation;