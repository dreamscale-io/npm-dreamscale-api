import agent from 'superagent';

// use an anonymous inner function in order to properly handle
// public and private functions. This also allows the API calls
// to be static 
export default (function() {
 
	function createOrganization(data, callback, error) {
		handleRequest('POST', '/api/organization', data, callback, error);
	}

	// private function used by the API Resources
	function handleRequest(method, url, data, callback, error) {
		agent(method, url)
	    .send(data)
	    .set('Accept', 'application/json')
	    .then(function(res) {
				let resObj = JSON.parse(res.text);

				if(resObj.status === 200) {
				  let data = JSON.parse(resObj.text);
				  if(data.connectionStatus === "VALID") {
				    callback(data);
				  } else {
				    error(null, data);
				  }
				} else {
				  throw new Error(
				  	"[" + resObj.status + "] " + resObj.text + " => " + 
				  	resObj.req.method + " " + resObj.req.url);
				}
	    })
	    .catch(function(err) {
	      error(err);
	      console.error("[API] " + err);
	    });
	}

	// expose our public functions
	return {
		Organization: {
			create: createOrganization
		}
	}
 
}());