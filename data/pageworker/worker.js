var clientId;
var selfIdentity;
var groupId;
var togetherJsLocation;
var tabId;
var viewerScript;
var togetherJsCss;
var state = "normal";

var shareTabId;
var match = /tabId=([^&]*)/.exec(location.search);
if (match && location.href.search(/^resource:.*blank\.html/) != -1) {
  shareTabId = match[1];
}

// We don't want to inherit anything from the TogetherJS session
unsafeWindow.TogetherJSConfig_disableSessionLoad = true;

self.port.on("init", function (data) {
  clientId = data.clientId;
  selfIdentity = data.selfIdentity;
  groupId = data.groupId;
  tabId = data.tabId;
  viewerScript = data.viewerScript;
  togetherJsLocation = data.togetherJsLocation;
  togetherJsCss = data.togetherJsCss;
  try {
    var event = unsafeWindow.document.createEvent('CustomEvent');
  } catch (e) {
    if ((""+e).indexOf("Permission denied") != -1) {
      return;
    }
    throw e;
  }
  event.initCustomEvent("hotdish-message", true, true, {
    type: "hello",
    groupId: groupId,
    clientId: clientId,
    selfIdentity: selfIdentity
  });
  unsafeWindow.document.documentElement.dispatchEvent(event);
  setState(data.state);
});

function setState(newState) {
  if (newState == "viewing") {
    if (state != "normal") {
      console.warn("Should only ever go from 'normal' to 'viewing'");
    }
    // Nothing to do, just wait for the mirror-doc messages
  } else if (newState == "normal") {
    // Turn off TogetherJS if necessary
    if (state == "viewing") {
      throw new Error("Can't go from 'viewing' to 'normal'");
    } else if (state == "presenting") {
      disablePresenting();
    } else if (state == "live") {
      disableLive();
    }
  } else if (newState == "live") {
    // Turn on TogetherJS for Live
    if (state == "viewing") {
      throw new Error("Can't go from 'viewing' to 'live'");
    } else if (state == "presenting") {
      disablePresenting();
      activateLive();
    } else if (state == "normal") {
      activateLive();
    }
  } else if (newState == "presenting") {
    if (state == "viewing") {
      throw new Error("Can't go from 'viewing' to 'presenting'");
    } else if (state == "live") {
      disableLive();
    }
    activatePresenting();
  } else {
    throw new Error("Unknown state: " + newState);
  }
  state = newState;
}

self.port.on("setState", setState);

function activateTogetherJS(roomName, overrides) {
  if (document.readyState == "loading") {
    try {
      unsafeWindow.localStorage.getItem("test");
    } catch (e) {
      // Sometimes we are too early to access localStorage
      console.log("Too early in", location.href);
      setTimeout(function () {
        activateTogetherJS(roomName, overrides);
      }, 100);
      return;
    }
  }
  var doc = unsafeWindow.document;
  var options = {
    findRoom: "hotdishshare_" + roomName,
    autoStart: true,
    getUserName: function () {
      return selfIdentity.name;
    },
    getUserAvatar: function () {
      return selfIdentity.avatar;
    },
    getUserColor: function () {
      return selfIdentity.color;
    },
    toolName: "hotdish",
    suppressJoinConfirmation: true,
    suppressInvite: true,
    suppressWalkthrough: true,
    disableWebRTC: true,
    disableInvite: true,
    disableChat: true,
    disableSelf: true,
    disablePeerDetail: true,
    forceIdentityId: clientId,
    forceSessionId: tabId,
    on: {
      ready: function () {
        //console.log("Got TJS clientId,", unsafeWindow.TogetherJS.require("session").clientId);
      }
    }
  };
  for (var attr in (overrides || {})) {
    if (attr == "on") {
      for (var event in overrides.on) {
        options.on[event] = overrides.on[event];
      }
      continue;
    }
    options[attr] = overrides[attr];
  }
  unsafeWindow.TogetherJSConfig = options;
  if (! unsafeWindow.TogetherJS) {
    var script = doc.createElement("script");
    script.src = togetherJsLocation + "?bust=" + Date.now();
    console.log("loading tjs from", togetherJsLocation);
    doc.head.appendChild(script);
    var style = doc.createElement("style");
    style.textContent = togetherJsCss;
    doc.head.appendChild(style);
  } else {
    if (unsafeWindow.TogetherJS.running) {
      // Restart:
      unsafeWindow.TogetherJS();
      var interval = setInterval(function () {
        if (! unsafeWindow.TogetherJS.running) {
          unsafeWindow.TogetherJS();
          clearTimeout(interval);
        }
      }, 100);
    } else {
      // Just start
      unsafeWindow.TogetherJS();
    }
  }
}

/* Presenter mode */

var emitterTimeout = null;

function activatePresenting() {
  disablePresenting();
  activateTogetherJS(clientId + tabId, {
    isSamePage: function () {return true;}
  });
  emitMirror();
  emitterTimeout = setInterval(emitMirror, 1000);
}

function disablePresenting() {
  clearTimeout(emitterTimeout);
  emitterTimeout = null;
  last = {};
  if (window.TogetherJS && window.TogetherJS.running) {
    window.TogetherJS();
  }
}

self.port.on("mirror-fault", function () {
  assert(state == "presenting");
  last = {};
  emitMirror();
});

var last = {
  body: null,
  head: null,
  headHtml: null,
  htmlAttrs: null,
  hash: null
};

function TRY(f, context) {
  try {
    if (context) {
      return f.call(context);
    } else {
      return f();
    }
  } catch (e) {
    console.log("Error in " + (f.name || f));
    console.log("Error:", e, e.name, JSON.stringify(e));
    console.log("Stack:", e.stack);
    throw e;
  }
}

// Sometimes the errors are being swallowed, and this writes them to
// the console even in those cases.
function WRAP(f) {
  return function () {
    var self = this;
    var args = arguments;
    return TRY(function () {
      return f.apply(self, args);
    });
  };
}

var emitMirror = WRAP(function emitMirror() {
  var doc = unsafeWindow.document;
  var msg = {};
  var headHtml = doc.head.innerHTML;
  if (last.headHtml != headHtml) {
    msg.head = Freeze.serializeElement(doc.head);
    last.headHtml = headHtml;
    if (last.head) {
      TRY(function () {
      msg.headDiff = Freeze.diffDocuments(last.head, doc.head);
      });
    }
    last.head = msg.head;
  }
  var bodyHtml = unsafeWindow.document.body.innerHTML;
  if (last.bodyHtml != bodyHtml) {
    msg.body = Freeze.serializeElement(doc.body);
    last.bodyHtml = bodyHtml;
    if (last.body) {
      TRY(function () {
      msg.bodyDiff = Freeze.diffDocuments(last.body, doc.body);
      });
    }
    last.body = msg.body;
  }
  if (last.htmlAttrs) {
    if (! Freeze.compareAttributes(last.htmlAttrs, doc.documentElement)) {
      last.htmlAttrs = msg.htmlAttrs = Freeze.serializeAttributes(doc.documentElement);
    }
  } else {
    last.htmlAttrs = msg.htmlAttrs =  Freeze.serializeAttributes(doc.documentElement);
  }
  if (msg.headDiff) {
    delete msg.head;
  }
  if (msg.bodyDiff) {
    delete msg.body;
  }
  var hash = location.hash || "";
  if (hash == "#") {
    hash = "";
  }
  if (hash != last.hash) {
    msg.hash = hash;
    last.hash = hash;
  }
  if (Object.keys(msg).length) {
    self.port.emit("emitMirror", msg);
  }
});

var lastIncoming = {
  url: null
};

/* Viewer mode */

var mirrorTogetherJS = false;
var mirrorScript = false;

self.port.on("mirror-doc", function (msg) {
  if (state != "viewing") {
    console.warn("Got mirror-doc without being in 'viewing' mode");
  }
  if (location.href.search(/^resource:.*blank\.html([?#].*)?$/) == -1) {
    console.warn("Got mirror-doc for a non-blank URL:", location.href);
    return;
  }
  var doc = unsafeWindow.document;
  if (! mirrorTogetherJS) {
    mirrorTogetherJS = true;
    activateTogetherJS(shareTabId, {
      isSamePage: function () {return true;},
      on: {
        close: function () {
          location.href = lastIncoming.url + location.hash;
        }
      }
    });
  }
  if (! mirrorScript) {
    mirrorScript = true;
    var script = doc.createElement("script");
    script.jsmirrorHide = true;
    script.id = "viewer";
    script.textContent = viewerScript;
    doc.head.appendChild(script);
  }
  if (lastIncoming.url && msg.url != lastIncoming.url) {
    // URL change
    self.port.emit("mirrorReload", msg);
  }
  if (! lastIncoming.url) {
    lastIncoming.url = msg.url;
    // FIXME: baseurl(msg.url)?
    Freeze.setBase(msg.url);
  }
  if (typeof msg.hash == "string") {
    var curHash = location.hash || "";
    if (curHash == "#") {
      curHash = "";
    }
    if (curHash != msg.hash) {
      location.hash = msg.hash;
    }
  }
  if (msg.htmlAttrs) {
    Freeze.setAttributes(doc.documentElement, msg.htmlAttrs);
  }
  var faulted = false;
  function onFault() {
    faulted = true;
  }
  if (msg.head) {
    Freeze.unfreeze(doc.head, msg.head);
  } else if (msg.headDiff) {
    Freeze.applyDiff(msg.headDiff, onFault);
  }
  if (msg.body) {
    Freeze.unfreeze(doc.body, msg.body);
  } else if (msg.bodyDiff) {
    Freeze.applyDiff(msg.bodyDiff, onFault);
  }
  if (faulted) {
    console.log("Faulted");
    self.port.emit("mirrorFault");
  }
});

/* Live mode */

function activateLive() {
  var url = location.href.replace(/#.*/, "");
  var urlHash = url.replace(/[^a-zA-Z0-9_]/, "");
  activateTogetherJS(urlHash);
}

function disableLive() {
  if (window.TogetherJS && window.TogetherJS.running) {
    window.TogetherJS();
  }
}


/* Misc stuff */

if (location.hash) {
  self.port.emit("hash", location.hash);
}

unsafeWindow.document.defaultView.addEventListener("hashchange", function () {
  self.port.emit("hash", location.hash);
}, false);

//unsafeWindow.document.documentElement.addEventListener("hotdish-send", function (event) {
//  console.log("Got message", event.detail);
//}, false);

window.addEventListener("pagehide", function () {
  // Send a bye whenever the page unloads...
  if (window.TogetherJS && window.TogetherJS.running) {
    window.TogetherJS();
  }
}, false);

self.port.emit("ready");
