var match = /groupId=([^&]*)/.exec(location.href);
var groupId = match[1];
match = /clientId=([^&]*)/.exec(location.href);
var myClientId = match[1];
var hubUrl = "https://hub.togetherjs.com/hub/" + groupId;
var clientId = localStorage.getItem("debugger_id");
if (! clientId) {
  clientId = "d_" + Math.floor(Math.random()*1000);
  localStorage.setItem("debugger_id", clientId);
}

$(function () {
  $("#sidebar").attr("href", "../socialapi/sidebar-ad.html" + location.search);
});

function Logger(container) {
  container = $(container);
  function log() {
    console.log.apply(console, arguments);
    var s;
    if (arguments.length == 1 && typeof arguments[0] == "object") {
      s = JSON.stringify(arguments[0], null, 2);
      s = s.split(/\n/g);
      s.splice(0, 1);
      s.splice(s.length-1, 1);
      s = s.map(function (i) {
        i = i.replace(/^  /, "");
        var match = /^(\s*)"([^"]+)":(.*)$/.exec(i);
        if (match) {
          i = match[1] + match[2] + ":" + match[3];
        }
        return i;
      });
      s = s.join("\n");
    } else {
      s = [];
      for (var i=0; i<arguments.length; i++) {
        if (typeof arguments[i] == "string") {
          s.push(arguments[i]);
        } else {
          s.push(JSON.stringify(arguments[i], null, 2));
        }
      }
      s = s.join(" ");
    }
    var el = $("<pre>").text(s);
    var li = $("<li>").append(el);
    container.append(li);
  }
  return log;
}

var logMessage = Logger("#messages");
var logInternal = Logger("#internal");

var hub = mixinEvents({});

logMessage("Opening:", hubUrl);
var channel = WebSocketChannel(hubUrl);

channel.onmessage = function (msg) {
  if (msg.clientId) {
    logMessage(msg);
    hub.emit(msg.type, msg);
  } else if (('sidebar' in msg && msg.sidebar == myClientId) ||
             ('addon' in msg && msg.addon == myClientId)) {
    logInternal(msg);
  }
};

function send(msg) {
  msg.clientId = clientId;
  channel.send(msg);
}

var participantActive = false;

function sendHello(helloBack) {
  var msg = {
    name: "Debugger",
    avatar: "",
    color: "#ff0000"
  };
  if (helloBack) {
    msg.type = "hello-back";
  } else {
    msg.type = "hello";
  }
  send(msg);
}

hub.on("hello", function () {
  if (participantActive) {
    sendHello(true);
  }
});

$("#start-user").click(function () {
  participantActive = true;
  sendHello(false);
  send({
    type: "tab-pageshow",
    windowid: "1234",
    tabid: 1,
    index: 0,
    pinned: false,
    title: "Fake Google",
    url: "https://www.google.com/#q=test",
    favicon: null
  });
});
