const request 			= require('request');
var config 				= require('config');
var constants 			= require("./constants");
const Configstore 		= require('configstore');
const conf 				= new Configstore(constants.HARBORMASTER);
var util 				= require('util');

module.exports =  {

	handleRequest : (endpoint, body, callback, post) => {

		const CLI         	= require('clui');
		const Spinner     	= CLI.Spinner;
		var status 		    = null;

        if (!process.env.HM_TEST) {
		    status = new Spinner(endpoint + ' please wait...');
			status.start();
        }

		if ( post == true ) {
            request(
                {
                    method: "POST",
                    uri: conf.get(constants.PLATFORM_URL) + "/" + endpoint,
                    headers: {
                        "Content-Type": "application/json"
                    },
                    json: body
                },
                (err, resp, body) => {

                    if ( status != null )
                        status.stop();

                    if (!err && resp.statusCode == 200)
                        return callback(null, body);
                    else
                        return callback(err, null);
                }
            );
		}
		else {
			request(conf.get(constants.PLATFORM_URL) + '/' + endpoint + '?' + body, { json: true }, (err, resp, body) => {
				if ( status != null )
					status.stop();

				if (!err && resp.statusCode == 200)
		            callback(null, body);
		        else {
		            callback(err, null);
		            }
			});
		}
	},
	
	asyncHandleRequest: (endpoint, body) => {
		return new Promise(function(resolve, reject) {
			request(conf.get(constants.PLATFORM_URL) + '/' + endpoint + '?' + body, { json: true }, (err, resp, body) =>  {
				if (!err && resp.statusCode == 200 ) {
					resolve(body);
	            } else {
	            	reject(err);	            
				}
			});
		});
	},
	
	packageInput: (token, serviceRequestType ) => {
		return {"token" : token, "serviceRequestType" : serviceRequestType };
	},

	packageInputAddToken: (serviceRequestType ) => {
		return {"userId" : conf.get(constants.USER_ID), "serviceRequestType" : serviceRequestType };
	}	
}
