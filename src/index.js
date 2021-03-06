import agent from 'superagent';
import bodyParser from 'body-parser';

const apiServer = process.env.API_SERVER || ("localhost:" + (process.env.PORT || 5000));
const apiProtocol = process.env.API_PROTOCOL || "http://";

export class ApiProxy {
	constructor(app, port, path) {
		console.log("[Server] create api proxy for -> " + apiProtocol + apiServer + " : " + path);
		this.path = path;

		/// use middleware to buffer data into res.body
		app.use(bodyParser.json());
	}

	// checks to see if we should use the proxy
	proxy(request, response) {
		if(request.baseUrl.startsWith(this.path)) {
			this.forwardRequest(request, response);
			return true;
		}
		return false;
	}

	// performs a proxy http request to dreamscale servers
	forwardRequest(request, response) {
		console.log("[Server] [API Proxy] forward => " + 
			request.hostname + " : " + request.method + " " + request.baseUrl + " -> " + 
			JSON.stringify(request.params) + " : " + 
			JSON.stringify(request.query) + " : " + 
			JSON.stringify(request.body));

		/// setup our request properties
		let header = this.scrubHeader(request.headers);
		let url = apiProtocol + apiServer + request.baseUrl.slice(4);
		let method = request.method.toUpperCase();
		let query = request.query;
		let body = request.body;

		/// forward the incoming request with properties
	 	let req = agent(method, url)
	 		.set(header)
	  	.buffer(true);

	  /// handle specific method types
	  if(method === "POST") {
	  	req.send(body);
	  } else if(method === "GET") {
	  	req.query(query);
	  }

	  /// perform the request
	  req.then(function(res) {
	    response.send(res)
	  })
	  .catch(function(err) {
   		if (method === "GET") { 
				response.send(err);
			} else {
				console.log("[Server] [API Proxy] [ERROR] " + err.message);
				if (err.response) {
					err.response.text = err.message;
					response.send(err.response);
				} else {
					response.status(400);
					response.send(err.message);
				}
			}
   	});
	}

	// removes any invalid header properties
	scrubHeader(header) {
		delete header['host'];
		delete header['content-length'];
		header['accept'] = "application/json";
		header['host'] = apiServer;
		return header;
	}
}

// use an anonymous inner function in order to properly handle
// public and private functions. This also allows the API calls
// to be static 
export default (function() {

	// private function used by the API Resources
	function handleRequest(method, url, data, callback, error) {
		
		/// build our request to send
		let request = agent(method, url);
		request.set('Accept', 'application/json');

		/// set data payload specific to method type
		if(method === "POST") {
			request.send(data);
		} else if(method === "GET") {
			request.query(data);
		}

		/// perform the request
	  request.then(function(res) {
			let resObj = JSON.parse(res.text);

			if(resObj.status === 200) {
			  let data = JSON.parse(resObj.text);
			  if(data.connectionStatus === "VALID") {
			    callback(data);
			  } else {
			    error(null, data);
			  }
			} else if(method === "GET") {
				if(resObj.response.text) {
					let data = JSON.parse(resObj.response.text);
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

	//
	// Organization API
	//

	function createOrganization(data, callback, error) {
		handleRequest('POST', '/api/organization', data, callback, error);
	}

	function decodeInvitation(query, callback, error) {
		handleRequest('GET', '/api/organization/member/invitation', query, callback, error);
	}

	// expose our public functions
	return {
		Organization: {
			create: createOrganization,
			Member: {
				decodeInvitation: decodeInvitation
			}
		}
	}

}());
