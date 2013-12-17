function mixinEvents(proto) {
  proto.on = function on(name, callback) {
    if (typeof callback != "function") {
      console.warn("Bad callback for", this, ".once(", name, ", ", callback, ")");
      throw "Error: .once() called with non-callback";
    }
    if (name.search(" ") != -1) {
      var names = name.split(/ +/g);
      names.forEach(function (n) {
        this.on(n, callback);
      }, this);
      return;
    }
    if (this._knownEvents && this._knownEvents.indexOf(name) == -1) {
      var thisString = "" + this;
      if (thisString.length > 20) {
        thisString = thisString.substr(0, 20) + "...";
      }
      console.warn(thisString + ".on('" + name + "', ...): unknown event");
      if (console.trace) {
        console.trace();
      }
    }
    if (! this._listeners) {
      this._listeners = {};
    }
    if (! this._listeners[name]) {
      this._listeners[name] = [];
    }
    if (this._listeners[name].indexOf(callback) == -1) {
      this._listeners[name].push(callback);
    }
  };
  proto.once = function once(name, callback) {
    if (typeof callback != "function") {
      console.warn("Bad callback for", this, ".once(", name, ", ", callback, ")");
      throw "Error: .once() called with non-callback";
    }
    var attr = "onceCallback_" + name;
    // FIXME: maybe I should add the event name to the .once attribute:
    if (! callback[attr]) {
      callback[attr] = function onceCallback() {
        callback.apply(this, arguments);
        this.off(name, onceCallback);
        delete callback[attr];
      };
    }
    this.on(name, callback[attr]);
  };
  proto.off = proto.removeListener = function off(name, callback) {
    if (this._listenerOffs) {
      // Defer the .off() call until the .emit() is done.
      this._listenerOffs.push([name, callback]);
      return;
    }
    if (name.search(" ") != -1) {
      var names = name.split(/ +/g);
      names.forEach(function (n) {
        this.off(n, callback);
      }, this);
      return;
    }
    if ((! this._listeners) || ! this._listeners[name]) {
      return;
    }
    var l = this._listeners[name], _len = l.length;
    for (var i=0; i<_len; i++) {
      if (l[i] == callback) {
        l.splice(i, 1);
        break;
      }
    }
  };
  proto.emit = function emit(name) {
    var offs = this._listenerOffs = [];
    if ((! this._listeners) || ! this._listeners[name]) {
      return;
    }
    var args = Array.prototype.slice.call(arguments, 1);
    var l = this._listeners[name];
    l.forEach(function (callback) {

      callback.apply(this, args);
    }, this);
    delete this._listenerOffs;
    if (offs.length) {
      offs.forEach(function (item) {
        this.off(item[0], item[1]);
      }, this);
    }

  };
  return proto;
};



/* A simple class pattern, use like:

  var Foo = util.Class({
    constructor: function (a, b) {
      init the class
    },
    otherMethod: ...
  });

You can also give a superclass as the optional first argument.

Instantiation does not require "new"

*/
var Class = function (superClass, prototype) {
  var a;
  if (prototype === undefined) {
    prototype = superClass;
  } else {
    if (superClass.prototype) {
      superClass = superClass.prototype;
    }
    var newPrototype = Object.create(superClass);
    for (a in prototype) {
      if (prototype.hasOwnProperty(a)) {
        newPrototype[a] = prototype[a];
      }
    }
    prototype = newPrototype;
  }
  var ClassObject = function () {
    var obj = Object.create(prototype);
    obj.constructor.apply(obj, arguments);
    obj.constructor = ClassObject;
    return obj;
  };
  ClassObject.prototype = prototype;
  if (prototype.constructor.name) {
    ClassObject.className = prototype.constructor.name;
    ClassObject.toString = function () {
      return '[Class ' + this.className + ']';
    };
  }
  if (prototype.classMethods) {
    for (a in prototype.classMethods) {
      if (prototype.classMethods.hasOwnProperty(a)) {
        ClassObject[a] = prototype.classMethods[a];
      }
    }
  }
  return ClassObject;
};

var assert = function (cond) {
  if (! cond) {
    var args = Array.prototype.slice.call(arguments, 1);
    console.warn(["Assertion Error:"].concat(args));
    console.trace();
    throw new Error("Assertion Error: " + args.join(" "));
  }
};
