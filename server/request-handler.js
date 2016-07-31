/*************************************************************

You should implement your request handler function in this file.

requestHandler is already getting passed to http.createServer()
in basic-server.js, but it won't work as is.

You'll have to figure out a way to export this function from
this file and include it in basic-server.js so that it actually works.

*Hint* Check out the node module documentation at http://nodejs.org/api/modules.html.

**************************************************************/
var url = require('url');

var defaultCorsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, accept",
  "Access-Control-Allow-Credentials": true,
  "Access-Control-Max-Age": '86400', // 24 hours
  "Access-Control-Allow-Headers": "X-Requested-With, Access-Control-Allow-Origin, X-HTTP-Method-Override, Content-Type, Accept"
};

var headers = defaultCorsHeaders;
headers['Content-Type'] = "application/json";

var urlMessages = {};
var startOjectId = 0;

var optionsHandler = function (request, response) {
  response.writeHead(200, headers);
  response.end();
};

var getHandler = function (request, response) {
  var resArray = urlMessages[url.parse(request.url).pathname] || [];

  response.writeHead(200, headers);
  response.end(JSON.stringify({ results: resArray }));
};

var forbiddenHandler = function (request, response) {
  response.writeHead(404, headers);
  response.end("Not found!");
};

var postHandler = function (request, response) {
  var body = '';
  request.on('data', function (chunk) {
    body += chunk;
  });

  request.on('end', function () {
    var message = JSON.parse(body);
    message.objectId = startOjectId++;
    message.createdTime = new Date();
    var msgs = urlMessages[request.url] || [];
    msgs.push(message);
    urlMessages[request.url] = msgs;
  });

  response.writeHead(201, headers);
  response.end(JSON.stringify({ objectId: startOjectId - 1 }));
};

exports.optionsHandler = optionsHandler;
exports.getHandler = getHandler;
exports.postHandler = postHandler;
exports.forbiddenHandler = forbiddenHandler;
