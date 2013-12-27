var clientId;
var selfIdentity;
var groupId;
//console.log("Started worker", location.href);

self.port.on("init", function (data) {
  //console.log("got init");
  clientId = data.clientId;
  selfIdentity = data.selfIdentity;
  groupId = data.groupId;
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
  unsafeWindow.localStorage.setItem("togetherjs.seenWalkthrough", "true");
  unsafeWindow.TogetherJSConfig = {
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
    disableWebRTC: true
  };
  var script = document.createElement("script");
  script.src = "https://togetherjs.com/togetherjs-min.js";
  document.head.appendChild(script);
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
