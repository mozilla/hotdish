const { EventTarget } = require("sdk/event/target");
const tabs = require("sdk/tabs");
const self = require("sdk/self");
const { Class } = require('sdk/core/heritage');
var { on, once, off, emit } = require('sdk/event/core');
const { URL } = require("sdk/url");

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

/* Like sdk/core/heritage EventTarget, but also adds relevent
   methods */
exports.EventMethods = Class({
  extends: EventTarget,

  on: function (type, handler) {
    return on(this, type, handler);
  },

  off: function (type, handler) {
    return off(this, type, handler);
  },

  once: function (type, handler) {
    return once(this, type, handler);
  },

  emit: function (type, event) {
    return emit.apply(null, [this].concat(Array.prototype.slice.call(arguments)));
  }
});

exports.cleanForId = function (s) {
  s = s.replace(/[^a-zA-Z0-9_-]/g, "");
  return s;
};

exports.bind = function (this_, methods) {
  if (typeof methods == "string") {
    methods = methods.split(/\s+/g);
  }
  methods.forEach(function (m) {
    if (! this_[m]) {
      throw new Error("Object " + this_ + " has no method " + m);
    }
    this_[m] = this_[m].bind(this_);
  });
};

exports.setHandlers = function (eventSource, eventHandlers, context, prefixArgs) {
  exports.assert(eventSource.on, "Tried to call setHandlers on an object with no .on method:", eventSource);
  context = context || eventSource;
  if (prefixArgs && ! Array.isArray(prefixArgs)) {
    prefixArgs = [prefixArgs];
  }
  for (let name in eventHandlers) {
    var method;
    if (prefixArgs) {
      method = (function (handler, context, prefixArgs) {
        return function () {
          handler.apply(context, prefixArgs.concat(Array.prototype.slice.call(arguments)));
        };
      })(eventHandlers[name], context, prefixArgs);
    } else {
      method = eventHandlers[name].bind(context);
    }
    eventSource.on(name, method);
  }
};

exports.copyMethods = function (context, sourceObj, methods) {
  if (typeof methods == "string") {
    methods = methods.split(/\s+/g);
  }
  methods.forEach(function (m) {
    if (! sourceObj[m]) {
      throw new Error("Method undefined: " + m + " in: " +sourceObj);
    }
    context[m] = sourceObj[m].bind(sourceObj);
  });
};

exports.decodeQuery = function (url) {
  if (url.indexOf("?") != -1) {
    url = url.substr(url.indexOf("?")+1);
  }
  var result = {};
  var parts = url.split(/&/g);
  parts.forEach(function (p) {
    var names = p.split("=");
    if (names.length == 1) {
      result[decodeURIComponent(names[0])] = null;
    } else {
      result[decodeURIComponent(names[0])] = decodeURIComponent(names[1]);
    }
  });
  return result;
};

exports.encodeQuery = function (vars) {
  var s = [];
  for (var name in vars) {
    s.push(encodeURIComponent(name) + "=" + encodeURIComponent(vars[name]));
  }
  return s.join('&');
};

exports.normalizeUrl = function (url) {
  var u = URL(url);
  return u.toString();
};

var ID_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-.";

exports.generateId = function () {
  var uuid = require('sdk/util/uuid').uuid;
  var num = uuid().number.slice(1, -1);
  num = num.replace(/-/g, "");
  num = parseInt(num, 16);
  var s = "";
  while (num > ID_CHARS.length) {
    s += ID_CHARS.charAt(num % ID_CHARS.length);
    num = Math.floor(num / ID_CHARS.length);
  }
  return s;
};
