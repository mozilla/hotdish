var clientId;
var selfIdentity;
var groupId;
var togetherJsLocation;
var tabId;
var viewerScript;
//console.log("Started worker", location.href);

var shareTabId;
var match = /tabId=([^&]*)/.exec(location.search);
if (match && location.href.search(/^resource:.*blank\.html/) != -1) {
  shareTabId = match[1];
}

self.port.on("init", function (data) {
  //console.log("got init");
  clientId = data.clientId;
  selfIdentity = data.selfIdentity;
  groupId = data.groupId;
  tabId = data.tabId;
  viewerScript = data.viewerScript;
  togetherJsLocation = data.togetherJsLocation;
  //console.log("init", data);
  try {
    var event = document.createEvent('CustomEvent');
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
  document.documentElement.dispatchEvent(event);
  //console.log("sent message", event.detail);
});

self.port.on("share", function (tabid) {
  activateTogetherJS(tabid, {});
});

function activateTogetherJS(tabid, overrides) {
  console.log("activating TJS", tabid, tabId, shareTabId, overrides);
  var doc = unsafeWindow.document;
  var options = {
    findRoom: "hotdishshare_" + groupId + "_" + tabid,
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
    on: {}
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
  var script = doc.createElement("script");
  script.src = togetherJsLocation;
  doc.head.appendChild(script);
  var style = doc.createElement("style");
  style.textContent = [
    "#togetherjs-menu-update-name {display: none;}",
    "#togetherjs-menu-update-avatar {display: none;}",
    "#togetherjs-menu-update-color {display: none;}"
  ].join("\n");
  doc.head.appendChild(style);
}

var emitterTimeout = null;

self.port.on("mirror", function () {
  console.log("Got mirror");
  cancelMirror();
  activateTogetherJS(tabId, {
    isSamePage: function () {return true;}
  });
  emitMirror();
  emitterTimeout = setInterval(emitMirror, 1000);
});

self.port.on("mirror-fault", function () {
  last = {};
  emitMirror();
});

self.port.emit("mirrorOff", function () {
  cancelMirror();
});

function cancelMirror() {
  clearTimeout(emitterTimeout);
  emitterTimeout = null;
  last = {};
}

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
      last.headDiff = Freeze.diffDocuments(last.head, msg.head);
      });
    }
    last.head = msg.head;
  }
  var bodyHtml = document.body.innerHTML;
  if (last.bodyHtml != bodyHtml) {
    msg.body = Freeze.serializeElement(doc.body);
    last.bodyHtml = bodyHtml;
    if (last.body) {
      TRY(function () {
      last.bodyDiff = Freeze.diffDocuments(last.body, msg.body);
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

var mirrorTogetherJS = false;
var mirrorScript = false;

self.port.on("mirror-doc", function (msg) {
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
    self.port.emit("mirrorFault");
  }
});

if (location.hash) {
  self.port.emit("hash", location.hash);
}

document.defaultView.addEventListener("hashchange", function () {
  self.port.emit("hash", location.hash);
}, false);

//document.documentElement.addEventListener("hotdish-send", function (event) {
//  console.log("Got message", event.detail);
//}, false);

self.port.emit("ready");
