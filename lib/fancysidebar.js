const { Class } = require('sdk/core/heritage');
const { assert, copyMethods } = require("utils");
const { Sidebar } = require("sdk/ui/sidebar");


/* This acts like the normal Sidebar, except it promotes the worker
   port to an attribute of the sidebar, and handles buffering of any
   messages until the sidebar worker is ready, as well as allowing you
   to listen to messages from the port immediately.

   Additionally it allows passing in initialization information to the
   sidebar through `initData`, which will be JSON'd and put in the
   query string, as a pattern for that sort of initialization.

 */
exports.Sidebar = Class({

  initialize: function (options) {
    if (options.initData) {
      this.initData = options.initData;
      delete options.initData;
    }
    this._buffer = [];
    this._ready = false;
    this.port = FakePort(this);
    this._worker = null;
    var oldOnAttach = options.onAttach;
    options.onAttach = (function (worker) {
      this._worker = worker;
      this.port._flush();
      worker.port.on("ready", (function () {
        this._ready = true;
        this.port._flush();
        this._buffer.forEach(function (e) {
          worker.port.emit.apply(worker.port, e);
        }, this);
      }).bind(this));
      if (this.initData) {
        worker.port.on("ready-init", (function () {
          worker.port.emit("init", this.initData);
        }).bind(this));
      }
      if (oldOnAttach) {
        oldOnAttach(worker);
      }
    }).bind(this);
    options.onDetach = (function () {
      this._worker = null;
      this._ready = false;
    }).bind(this);
    this._sidebar = Sidebar(options);
    copyMethods(this, this._sidebar, "show hide dispose on once removeListener");
  }

});

var FakePort = Class({
  initialize: function (sidebar) {
    this._sidebar = sidebar;
    this._buffer = [];
    this._deferOn = [];
  },
  emit: function () {
    if (this._sidebar._ready) {
      this._sidebar._worker.port.emit.apply(this._sidebar._worker.port, arguments);
    } else {
      this._buffer.push(Array.prototype.slice.call(arguments));
    }
  },
  on: function () {
    if (this._sidebar._worker) {
      this._sidebar._worker.port.on.apply(this._sidebar._worker.port, arguments);
    } else {
      this._deferOn.push(Array.prototype.slice.call(arguments));
    }
  },
  _flush: function () {
    if (this._sidebar._worker) {
      this._deferOn.forEach(function (args) {
        this._sidebar._worker.port.on.apply(this._sidebar._worker.port, args);
      }, this);
      this._deferOn = [];
    }
    if (this._sidebar._ready) {
      this._buffer.forEach(function (args) {
        this._sidebar._worker.port.emit.apply(this._sidebar._worker.port, args);
      }, this);
      this._buffer = [];
    }
  }
});
