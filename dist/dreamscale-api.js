'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.ApiProxy = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var apiServer = process.env.API_SERVER || "localhost:" + (process.env.PORT || 5000);
var apiProtocol = process.env.API_PROTOCOL || "http://";

var ApiProxy = exports.ApiProxy = function () {
	function ApiProxy(app, port, path) {
		_classCallCheck(this, ApiProxy);

		console.log("[Server] create api proxy for -> " + apiProtocol + apiServer + " : " + path);
		this.path = path;

		/// use middleware to buffer data into res.body
		app.use(_bodyParser2.default.json());
	}

	// checks to see if we should use the proxy


	_createClass(ApiProxy, [{
		key: 'proxy',
		value: function proxy(request, response) {
			if (request.baseUrl.startsWith(this.path)) {
				this.forwardRequest(request, response);
				return true;
			}
			return false;
		}

		// performs a proxy http request to dreamscale servers

	}, {
		key: 'forwardRequest',
		value: function forwardRequest(request, response) {
			console.log("[Server] [API Proxy] forward => " + request.hostname + " : " + request.method + " " + request.baseUrl + " -> " + JSON.stringify(request.params) + " : " + JSON.stringify(request.query) + " : " + JSON.stringify(request.body));

			/// setup our request properties
			var header = this.scrubHeader(request.headers);
			var url = apiProtocol + apiServer + request.baseUrl.slice(4);
			var method = request.method.toUpperCase();
			var query = request.query;
			var body = request.body;

			/// forward the incoming request with properties
			var req = (0, _superagent2.default)(method, url).set(header).buffer(true);

			/// handle specific method types
			if (method === "POST") {
				req.send(body);
			} else if (method === "GET") {
				req.query(query);
			}

			/// perform the request
			req.then(function (res) {
				response.send(res);
			}).catch(function (err) {
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

	}, {
		key: 'scrubHeader',
		value: function scrubHeader(header) {
			delete header['host'];
			delete header['content-length'];
			header['accept'] = "application/json";
			header['host'] = apiServer;
			return header;
		}
	}]);

	return ApiProxy;
}();

// use an anonymous inner function in order to properly handle
// public and private functions. This also allows the API calls
// to be static 


exports.default = function () {

	// private function used by the API Resources
	function handleRequest(method, url, data, callback, error) {

		/// build our request to send
		var request = (0, _superagent2.default)(method, url);
		request.set('Accept', 'application/json');

		/// set data payload specific to method type
		if (method === "POST") {
			request.send(data);
		} else if (method === "GET") {
			request.query(data);
		}

		/// perform the request
		request.then(function (res) {
			var resObj = JSON.parse(res.text);

			if (resObj.status === 200) {
				var _data = JSON.parse(resObj.text);
				if (_data.connectionStatus === "VALID") {
					callback(_data);
				} else {
					error(null, _data);
				}
			} else if (method === "GET") {
				if (resObj.response.text) {
					var _data2 = JSON.parse(resObj.response.text);
					error(null, _data2);
				}
			} else {
				throw new Error("[" + resObj.status + "] " + resObj.text + " => " + resObj.req.method + " " + resObj.req.url);
			}
		}).catch(function (err) {
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
	};
}();