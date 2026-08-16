const xss = require('xss');

// Recursive function to sanitize strings in objects/arrays
const cleanInput = (data) => {
  if (typeof data === 'string') {
    return xss(data);
  }
  if (Array.isArray(data)) {
    return data.map(item => cleanInput(item));
  }
  if (data !== null && typeof data === 'object') {
    const cleanedObj = {};
    for (const key of Object.keys(data)) {
      cleanedObj[key] = cleanInput(data[key]);
    }
    return cleanedObj;
  }
  return data;
};

const xssSanitizer = (req, res, next) => {
  if (req.body) req.body = cleanInput(req.body);
  if (req.query) req.query = cleanInput(req.query);
  if (req.params) req.params = cleanInput(req.params);
  next();
};

module.exports = xssSanitizer;
