var {Cc, Ci} = require("chrome");
var data = require("sdk/self").data;

var sss = Cc["@mozilla.org/content/style-sheet-service;1"]
             .getService(Ci.nsIStyleSheetService);
var ios = Cc["@mozilla.org/network/io-service;1"]
             .getService(Ci.nsIIOService);

exports.register = function register(aURL) {
  if(!isRegistered(aURL))
    sss.loadAndRegisterSheet(aURL, sss.USER_SHEET);

  require("sdk/system/unload").when(function() {
    if(isRegistered(aURL))
      sss.unregisterSheet(aURL, sss.USER_SHEET);
  })
}

exports.unregister = function unregister(aURL) {
  if(isRegistered(aURL)) {
    sss.unregisterSheet(aURL, sss.USER_SHEET);
  }
}

function isRegistered(aURL) {
  return sss.sheetRegistered(aURL, sss.USER_SHEET);
}

exports.getURI = function getURL(uri) {
  return ios.newURI(data.url(uri), null, null);
}
