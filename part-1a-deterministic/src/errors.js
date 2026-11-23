export function errorResponse(code, message, details = []) {
  return { code, message, details };
}

export function sendJson(response, status, code, message, details = []) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(errorResponse(code, message, details)));
}

export function detail(field, rule, message) {
  return { field, rule, message };
}
