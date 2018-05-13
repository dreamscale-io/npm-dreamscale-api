'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// use an anonymous inner function in order to properly handle
// public and private functions. This also allows the API calls
// to be static 
exports.default = function () {

	function createOrganization(data, callback, error) {
		handleRequest('POST', '/api/organization', data, callback, error);
	}

	// private function used by the API Resources
	function handleRequest(method, url, data, callback, error) {
		(0, _superagent2.default)(method, url).send(data).set('Accept', 'application/json').then(function (res) {
			var resObj = JSON.parse(res.text);

			if (resObj.status === 200) {
				var _data = JSON.parse(resObj.text);
				if (_data.connectionStatus === "VALID") {
					callback(_data);
				} else {
					error(null, _data);
				}
			} else {
				throw new Error("[" + resObj.status + "] " + resObj.text + " => " + resObj.req.method + " " + resObj.req.url);
			}
		}).catch(function (err) {
			error(err);
			console.error("[API] " + err);
		});
	}

	// expose our public functions
	return {
		Organization: {
			create: createOrganization
		}
	};
}();