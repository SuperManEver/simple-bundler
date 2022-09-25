const path = require("path");

function resolveRequest(requester, requestedPath) {
  return path.join(path.dirname(requester), requestedPath);
}

module.exports = resolveRequest;
