const tabs = require("tabs");
const self = require("self");

exports.assert = function (cond) {
  if (! cond) {
    var args = Array.prototype.slice.call(arguments, 1);
    console.warn(["Assertion Error:"].concat(args));
    throw new Error("Assertion Error: " + args.join(" "));
  }
};

exports.openData = function (base, params) {
  var url = self.data.url(base) + "?";
  var first = true;
  for (var name in params) {
    if (first) {
      first = false;
    } else {
      url += "&";
    }
    url += name + "=" + encodeURIComponent(params[name]);
  }
  tabs.open(url);
};
