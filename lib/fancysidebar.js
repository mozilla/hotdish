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

   Also it only allows one instance of the sidebar, and will hide any
   other instances that try to come into being while that one instance
   is open.

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
    var oldOnShow = options.onShow;
    var oldOnHide = options.onHide;
    var ID=0;
    options.onAttach = (function (worker) {
      worker.ID = ID++;
      if (this._worker) {
        // Two workers, means we have an attempt at a second sidebar, which
        // we do not allow.  Hence we ignore this attach.
        return;
      }
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
    this._sidebarCount = 0;
    this.visible = false;
    options.onShow = (function () {
      this._sidebarCount++;
      this.visible = !! this._sidebarCount;
      if (this._sidebarCount > 1) {
        this.hide();
        return;
      }
      if (oldOnShow) {
        oldOnShow(this);
      }
    }).bind(this);
    options.onHide = (function () {
      this._sidebarCount--;
      this.visible = !! this._sidebarCount;
      if (! this._sidebarCount) {
        if (oldOnHide) {
          oldOnHide(this);
        }
      }
    }).bind(this);
    options.onDetach = (function (worker) {
      // When closing the not-prime sidebar, we will get another
      // detach event, but that involves a worker we never cared
      // about; only if we are detaching the main worker do we become
      // "unready"
      if (this._worker == worker) {
        this._worker = null;
        this._ready = false;
      }
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
