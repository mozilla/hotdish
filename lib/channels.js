/* Channel abstraction.  Supported channels:

- WebSocket to an address
- port.emit/port.on proxying
- postMessage between windows

In the future:

- XMLHttpRequest to a server (with some form of queuing)

The interface:

  channel = new ChannelName(parameters)

The instantiation is per-channel-type

Methods:

  onmessage: set to function (jsonData)
  rawdata: set to true if you want onmessage to receive raw string data
  onclose: set to function ()
  onopen: set to function ()
  send: function (string or jsonData)
  close: function ()

.send() will encode the data if it is not a string.

(should I include readyState as an attribute?)

Channels must accept messages immediately, caching if the connection
is not fully established yet.

*/

if (typeof exports != "undefined" && typeof require != "undefined" &&
    typeof setTimeout == "undefined") {
  // In an addon context, need to import setTimeout
  setTimeout = require("sdk/timers").setTimeout;
  clearTimeout = require("sdk/timers").clearTimeout;
}


function AbstractChannel() {
  this.constructor.apply(this, arguments);
}
/* Subclasses must define:

- ._send(string)
- ._setupConnection()
- ._ready()
- .close() (and must set this.closed to true)

And must call:

- ._flush() on open
- ._incoming(string) on incoming message
- onclose()/onopen() (not onmessage - instead _incoming)
*/

AbstractChannel.subclass = function (overrides) {
  var C = function C() {
    var obj = Object.create(C.prototype);
    obj.constructor.apply(obj, arguments);
    obj.baseConstructor.apply(obj, arguments);
    return obj;
  };
  C.prototype = Object.create(AbstractChannel.prototype);
  for (var i in overrides) {
    if (overrides.hasOwnProperty(i)) {
      C.prototype[i] = overrides[i];
    }
  }
  return C;
};

AbstractChannel.prototype = {
  onmessage: null,
  rawdata: false,
  onclose: null,
  onopen: null,
  closed: false,

  baseConstructor: function () {
    this._buffer = [];
    this._setupConnection();
  },

  send: function (data) {
    if (this.closed) {
      throw 'Cannot send to a closed connection';
    }
    if (typeof data != "string") {
      data = JSON.stringify(data);
    }
    if (! this._ready()) {
      this._buffer.push(data);
      return;
    }
    this._send(data);
  },

  _flush: function () {
    for (var i=0; i<this._buffer.length; i++) {
      this._send(this._buffer[i]);
    }
    this._buffer = [];
  },

  _incoming: function (data) {
    if (! this.rawdata) {
      try {
        data = JSON.parse(data);
      } catch (e) {
        console.error("Got invalid JSON data:", data.substr(0, 40));
        throw e;
      }
    }
    if (this.onmessage) {
      this.onmessage(data);
    }
  },

  emitOn: function (obj, type) {
    type = type || "message";
    this.onmessage = function (data) {
      obj.emit(type, data);
    };
  }

};


var WebSocketChannel = AbstractChannel.subclass({

  constructor: function (address) {
    if (address.search(/^https?:/i) === 0) {
      address = address.replace(/^http/i, 'ws');
    }
    this.address = address;
    this.socket = null;
    this._reopening = false;
  },

  toString: function () {
    var s = '[WebSocketChannel to ' + this.address;
    if (! this.socket) {
      s += ' (socket unopened)';
    } else {
      s += ' readyState: ' + this.socket.readyState;
    }
    if (this.closed) {
      s += ' CLOSED';
    }
    return s + ']';
  },

  close: function () {
    this.closed = true;
    if (this.socket) {
      // socket.onclose will call this.onclose:
      this.socket.close();
    } else {
      if (this.onclose) {
        this.onclose();
      }
    }
  },

  _send: function (data) {
    this.socket.send(data);
  },

  _ready: function () {
    return this.socket && this.socket.readyState == this.socket.OPEN;
  },

  _setupConnection: function () {
    if (this.closed) {
      return;
    }
    this.socket = new WebSocket(this.address);
    this.socket.onopen = (function () {
      this._flush();
      if ((! this._reopening) && this.onopen) {
        this.onopen();
      }
      this._reopening = false;
    }).bind(this);
    this.socket.onclose = (function (event) {
      this.socket = null;
      console.error('WebSocket close', event.wasClean ? 'clean' : 'unclean',
                    'code:', event.code, 'reason:', event.reason || 'none');
      if (! this.closed) {
        this._reopening = true;
        this._setupConnection();
      }
    }).bind(this);
    this.socket.onmessage = (function (event) {
      this._incoming(event.data);
    }).bind(this);
    this.socket.onerror = (function (event) {
      console.error('WebSocket error:', event.data);
    }).bind(this);
  }

});


/* Sends TO a window or iframe */
var PostMessageChannel = AbstractChannel.subclass({
  _pingPollPeriod: 100, // milliseconds
  _pingPollIncrease: 100, // +100 milliseconds for each failure
  _pingMax: 2000, // up to a max of 2000 milliseconds

  constructor: function (win, expectedOrigin) {
    this.expectedOrigin = expectedOrigin;
    this._pingReceived = false;
    this._receiveMessage = this._receiveMessage.bind(this);
    if (win) {
      this.bindWindow(win, true);
    }
    this._pingFailures = 0;
  },

  toString: function () {
    var s = '[PostMessageChannel';
    if (this.window) {
      s += ' to window ' + this.window;
    } else {
      s += ' not bound to a window';
    }
    if (this.window && ! this._pingReceived) {
      s += ' still establishing';
    }
    return s + ']';
  },

  bindWindow: function (win, noSetup) {
    if (this.window) {
      this.close();
      // Though we deinitialized everything, we aren't exactly closed:
      this.closed = false;
    }
    if (win && win.contentWindow) {
      win = win.contentWindow;
    }
    this.window = win;
    // FIXME: The distinction between this.window and window seems unimportant
    // in the case of postMessage
    var w = this.window;
    // In a Content context we add the listener to the local window
    // object, but in the addon context we add the listener to some
    // other window, like the one we were given:
    if (typeof window != "undefined") {
      w = window;
    }
    w.addEventListener("message", this._receiveMessage, false);
    if (! noSetup) {
      this._setupConnection();
    }
  },

  _send: function (data) {
    this.window.postMessage(data, this.expectedOrigin || "*");
  },

  _ready: function () {
    return this.window && this._pingReceived;
  },

  _setupConnection: function () {
    if (this.closed || this._pingReceived || (! this.window)) {
      return;
    }
    this._pingFailures++;
    this._send("hello");
    // We'll keep sending ping messages until we get a reply
    var time = this._pingPollPeriod + (this._pingPollIncrease * this._pingFailures);
    time = time > this._pingPollMax ? this._pingPollMax : time;
    this._pingTimeout = setTimeout(this._setupConnection.bind(this), time);
  },

  _receiveMessage: function (event) {
    if (event.source !== this.window) {
      return;
    }
    if (this.expectedOrigin && event.origin != this.expectedOrigin) {
      console.info("Expected message from", this.expectedOrigin,
                   "but got message from", event.origin);
      return;
    }
    if (! this.expectedOrigin) {
      this.expectedOrigin = event.origin;
    }
    if (event.data == "hello") {
      this._pingReceived = true;
      if (this._pingTimeout) {
        clearTimeout(this._pingTimeout);
        this._pingTimeout = null;
      }
      if (this.onopen) {
        this.onopen();
      }
      this._flush();
      return;
    }
    this._incoming(event.data);
  },

  close: function () {
    this.closed = true;
    this._pingReceived = false;
    if (this._pingTimeout) {
      clearTimeout(this._pingTimeout);
    }
    window.removeEventListener("message", this._receiveMessage, false);
    if (this.onclose) {
      this.onclose();
    }
  }

});


/* Handles message FROM an exterior window/parent */
var PostMessageIncomingChannel = AbstractChannel.subclass({

  constructor: function (expectedOrigin) {
    this.source = null;
    this.expectedOrigin = expectedOrigin;
    this._receiveMessage = this._receiveMessage.bind(this);
    window.addEventListener("message", this._receiveMessage, false);
  },

  toString: function () {
    var s = '[PostMessageIncomingChannel';
    if (this.source) {
      s += ' bound to source ' + s;
    } else {
      s += ' awaiting source';
    }
    return s + ']';
  },

  _send: function (data) {
    this.source.postMessage(data, this.expectedOrigin);
  },

  _ready: function () {
    return !!this.source;
  },

  _setupConnection: function () {
  },

  _receiveMessage: function (event) {
    if (this.expectedOrigin && this.expectedOrigin != "*" &&
        event.origin != this.expectedOrigin) {
      // FIXME: Maybe not worth mentioning?
      console.info("Expected message from", this.expectedOrigin,
                   "but got message from", event.origin);
      return;
    }
    if (! this.expectedOrigin) {
      this.expectedOrigin = event.origin;
    }
    if (! this.source) {
      this.source = event.source;
    }
    if (event.data == "hello") {
      // Just a ping
      this.source.postMessage("hello", this.expectedOrigin);
      return;
    }
    this._incoming(event.data);
  },

  close: function () {
    this.closed = true;
    window.removeEventListener("message", this._receiveMessage, false);
    if (this._pingTimeout) {
      clearTimeout(this._pingTimeout);
    }
    if (this.onclose) {
      this.onclose();
    }
  }

});


var CHROME_CHANNEL_EVENT = "BrowserMirrorChromeChannel";

/* Sends TO a window or iframe, from a CHROME window.  Windows and
iframes can't talk back to a chrome window, so we use another
approach */
var ChromePostMessageChannel = AbstractChannel.subclass({
  _pingPollPeriod: 100, // milliseconds

  constructor: function (win, doc, expectedOrigin) {
    this.expectedOrigin = expectedOrigin;
    this._pingReceived = false;
    this.doc = doc;
    if (win) {
      this.bindWindow(win, true);
    }
    this._receiveMessage = this._receiveMessage.bind(this);
    this.doc.addEventListener(CHROME_CHANNEL_EVENT, this._receiveMessage, false, true);
  },

  toString: function () {
    var s = '[ChromePostMessageChannel';
    if (this.window) {
      s += ' to window ' + this.window;
    } else {
      s += ' not bound to a window';
    }
    if (this.window && ! this._pingReceived) {
      s += ' still establishing';
    }
    return s + ']';
  },

  bindWindow: function (win, noSetup) {
    if (this.window) {
      this.close();
    }
    if (win && win.contentWindow) {
      win = win.contentWindow;
    }
    this.window = win;
    if (! noSetup) {
      this._setupConnection();
    }
  },

  _send: function (data) {
    this.window.postMessage(data, this.expectedOrigin || "*");
  },

  _ready: function () {
    return this.window && this.pingReceived;
  },

  _setupConnection: function () {
    if (this.closed || this._pingReceived || (! this.window)) {
      return;
    }
    this._send("hello");
    this._pingTimeout = setTimeout(this._setupConnection.bind(this), this._pingPollPeriod);
  },

  _receiveMessage: function (event) {
    var el = event.target;
    var data = el.getAttribute('data-payload');
    el.parentNode.removeChild(el);
    el = null;
    if (data == "hello") {
      this._pingReceived = true;
      if (this._pingTimeout) {
        clearTimeout(this._pingTimeout);
        this._pingTimeout = null;
      }
      if (this.onopen) {
        this.onopen();
      }
      this._flush();
      return;
    }
    self._incoming(data);
  },

  close: function () {
    this.closed = true;
    this.doc.remoteEventListener(CHROME_CHANNEL_EVENT, this._receiveMessage, false, true);
    if (this._pingTimeout) {
      clearTimeout(this._pingTimeout);
    }
    if (this.onclose) {
      this.onclose();
    }
  }

});


/* Handles message FROM an exterior CHROME window/parent, with events
for handling the inability of these windows to talk to their chrome
parents */
var ChromePostMessageIncomingChannel = AbstractChannel.subclass({

  constructor: function () {
    this._receiveMessage = this._receiveMessage.bind(this);
    window.addEventListener("message", this._receiveMessage, false);
  },

  toString: function () {
    var s = '[ChromePostMessageIncomingChannel]';
    return s;
  },

  _ready: function () {
    return !! document.head;
  },

  _send: function (data) {
    var event = document.createEvent("Events");
    event.initEvent(CHROME_CHANNEL_EVENT, true, false);
    var el = document.createElement("BrowserMirrorPayloadElement");
    el.setAttribute("data-payload", data);
    document.head.appendChild(el);
    el.dispatchEvent(event);
  },

  _setupConnection: function () {
  },

  _receiveMessage: function (event) {
    if (event.source || event.origin) {
      // If either of these are set, it's not a postMessage from a
      // Chrome window
      // FIXME: warn?  Or an option to warn in this case?
      return;
    }
    if (event.data == "hello") {
      if (this._ready()) {
        this._send("hello");
      } else {
        // Wait a moment to respond
        setTimeout((function () {
          this._receiveMessage(event);
        }).bind(this), 100);
      }
      return;
    }
    this._incoming(event.data);
  },

  close: function () {
    this.closed = true;
    window.removeEventListener("message", this._receiveMessage, false);
    if (this.onclose) {
      this.onclose();
    }
  }

});

/* Sends messages over a port.  The "port" is the port object, such as self.port
   or worker.port; it must implement emit, on, and removeListener.

   Closed and Opened events are sent across the port to indicate when
  the remote channel is setup or closed.
*/
var PortChannel = AbstractChannel.subclass({

  constructor: function (port, prefix) {
    this.prefix = prefix || '';
    this.port = port;
    this._incoming = this._incoming.bind(this);
    this._remoteOpened = this._remoteOpened.bind(this);
    this._remoteClosed = this._remoteClosed.bind(this);
    this._gotHello = false;
  },

  toString: function () {
    var s = '[PortChannel';
    s += ' port: ' + this.port.toString();
    if (this.prefix) {
      s += ' prefix: "' + this.prefix + '"';
    }
    s += ']';
    return s;
  },

  _setupConnection: function () {
    this.port.on(this.prefix + 'Send', this._incoming);
    this.port.on(this.prefix + 'Opened', this._remoteOpened);
    this.port.on(this.prefix + 'Closed', this._remoteClosed);
    this.port.emit("Opened");
  },

  destroy: function () {
    this.port.removeListener(this.prefix + 'Send', this._incoming);
    this.port.removeListener(this.prefix + 'Opened', this._remoteOpened);
    this.port.removeListener(this.prefix + 'Closed', this._remoteClosed);
  },

  _ready: function () {
    // FIXME: is any kind of ping necessary?
    return this._gotHello;
  },

  _remoteOpened: function (helloBack) {
    this._gotHello = true;
    if (! helloBack) {
      // We'll say hello back, in case our original hello was lost
      this.port.emit("Opened", true);
    }
    if (this.onopen) {
      this.onopen();
    }
    this._flush();
  },

  _remoteClosed: function () {
    this._gotHello = false;
    if (this.onclose) {
      this.onclose();
    }
    this.destroy();
  },

  close: function () {
    this.port.emit("Closed");
    this._remoteClosed();
  },

  _send: function (s) {
    this.port.emit("Send", s);
  }

});


/* This proxies to another channel located in another process, via port.emit/port.on */
var PortProxyChannel = AbstractChannel.subclass({

  constructor: function (prefix, self_) {
    this.prefix = prefix || '';
    this.self = self_ || self;
    this._incoming = this._incoming.bind(this);
    this._remoteOpened = this._remoteOpened.bind(this);
  },

  toString: function () {
    var s = '[PortProxyChannel';
    if (typeof self == "undefined" || this.self !== self) {
      s += ' bound to self ' + this.self;
    }
    if (this.prefix) {
      s += ' with prefix "' + this.prefix + '"';
    }
    return s + ']';
  },

  _setupConnection: function () {
    this.self.port.on(this.prefix + "IncomingData", this._incoming);
    this.self.port.on(this.prefix + "Opened", this._remoteOpened);
  },

  _ready: function () {
    // FIXME: is any kind of ping necessary?
    return true;
  },

  _send: function (data) {
    this.self.port.emit(this.prefix + "SendData", data);
  },

  close: function () {
    try {
      this.self.port.emit(this.prefix + "Close");
    } catch (e) {
      console.log('Error on close', e, e.name);
    }
    this.self.port.removeListener(this.prefix + "IncomingData", this._incoming);
    this.self.port.removeListener(this.prefix + "Opened", this._remoteOpened);
    this.closed = true;
    if (this.onclose) {
      this.onclose();
    }
  },

  _remoteOpened: function () {
    // Note this isn't the same as _ready, because we rely on the
    // remote connection to do caching/buffering
    if (this.onopen) {
      this.onopen();
    }
  }

});

/* Will handle incoming requests for the given channel over a port.
Returns a function that tears down this connection.  The teardown
happens automatically on close. */
function PortIncomingChannel(channel, prefix, self_) {
  prefix = prefix || '';
  self_ = self_ || self;
  function remoteSendData(data) {
    channel.send(data);
  }
  function remoteClose() {
    self_.port.removeListener(prefix + "SendData", remoteSendData);
    self_.port.removeListener(prefix + "Close", remoteClose);
    channel.close();
  }
  self_.port.on(prefix + "SendData", remoteSendData);
  self_.port.on(prefix + "Close", remoteClose);
  channel.rawdata = true;
  channel.onmessage = function (data) {
    self_.port.emit(prefix + "IncomingData", data);
  };
  channel.onopen = function () {
    self_.port.emit(prefix + "Opened");
  };
  channel.onclose = function () {
    // FIXME: call remoteClose?
    self_.port.emit(prefix + "Closed");
  };
  return {
    close: remoteClose
  };
}

var WebSocketWorker = AbstractChannel.subclass({

  constructor: function (address, onTerminateSend) {
    if (address.search(/^https?:/i) === 0) {
      address = address.replace(/^http/i, 'ws');
    }
    this.address = address;
    if (typeof require == "undefined") {
      throw new Error("Cannot use WebSocketWorker in content");
    }
    this._remoteOpened = this._remoteOpened.bind(this);
    this._incoming = this._incoming.bind(this);
    this._Page = require("sdk/page-worker").Page;
    this._data = require("sdk/self").data;
    this._worker = null;
    this.onTerminateSend = onTerminateSend;
  },

  toString: function () {
    var s = '[WebSocketWorker to ' + this.address;
    s += ']';
    return s;
  },

  _send: function (data) {
    this._worker.port.emit("SendData", data);
  },

  _ready: function () {
    return true;
  },

  _setupConnection: function () {
    this._worker = this._Page({
      contentScriptFile: [
        this._data.url("channels/channels.js"),
        this._data.url("channels/wsecho.js")
      ],
      contentUrl: this._data.url("channels/blank.html")
    });
    this._worker.port.on("ready", (function () {
      if (this.onTerminateSend) {
        this._worker.port.emit("onTerminateSend", this.onTerminateSend);
      }
    }).bind(this));
    this._worker.port.on("IncomingData", this._incoming);
    this._worker.port.on("Opened", this._remoteOpened);
    this._worker.port.emit("StartProxier", this.address);
  },

  close: function () {
    try {
      this._worker.port.emit("Close");
    } catch (e) {
      console.log("Error on close", e, e.name);
    }
    this._worker.port.removeListener("IncomingData", this._incoming);
    this._worker.port.removeListener("Opened", this._remoteOpened);
    this.closed = true;
    if (this.onclose) {
      this.onclose();
    }
  },

  _remoteOpened: function () {
    if (this.onopen) {
      this.onopen();
    }
  }

});

/* Echos all the connection proxying from from_ (the worker that wants
a connection) to to_ (the worker that actually implements the
connection).  Returns a function that will tear down the connection. */
function EchoProxy(from_, to_, prefix) {
  prefix = prefix || '';
  var bindings = [];
  function echo(name, source, dest) {
    function echoer() {
      var args = [name];
      for (var i=0; i<arguments.length; i++) {
        args.push(arguments[i]);
      }
      dest.port.emit.apply(dest.port, args);
    }
    source.port.on(name, echoer);
    bindings.push([source.port, name, echoer]);
  }
  function removeBindings() {
    for (var i=0; i<bindings.length; i++) {
      bindings[i][0].removeListener(bindings[i][1], bindings[i][2]);
    }
  }
  echo(prefix + "IncomingData", to_, from_);
  echo(prefix + "Opened", to_, from_);
  echo(prefix + "Closed", to_, from_);
  echo(prefix + "SendData", from_, to_);
  echo(prefix + "Close", from_, to_);
  return {
    close: removeBindings,
    send: function (data) {
      if (typeof data != "string") {
        data = JSON.stringify(data);
      }
      to_.port.emit(prefix + "SendData", data);
    }
  };
}


if (typeof exports != "undefined") {
  exports.EchoProxy = EchoProxy;
  exports.PostMessageChannel = PostMessageChannel;
  exports.ChromePostMessageChannel = ChromePostMessageChannel;
  exports.PostMessageIncomingChannel = PostMessageIncomingChannel;
  exports.PortChannel = PortChannel;
  exports.PortProxyChannel = PortProxyChannel;
  exports.WebSocketWorker = WebSocketWorker;
}
