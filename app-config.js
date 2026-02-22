(function () {
  // Default domain online A-IOS (bisa diganti kapan saja)
  var onlineApi = 'https://a-ios-api.onrender.com/api';
  var isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  window.AIOS_API_BASE = window.AIOS_API_BASE || (isLocal ? 'http://localhost:4000/api' : onlineApi);
})();
