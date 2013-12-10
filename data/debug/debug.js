var match = /groupId=(.*)/.exec(location.href);
var groupId = match[1];
var hubUrl = "https://hub.togetherjs.com/hub/" + groupId;
var clientId = localStorage.getItem("debugger_id");
if (! clientId) {
  clientId = "d_" + Math.floor(Math.random()*1000);
  localStorage.setItem("debugger_id", clientId);
}

$(function () {
  $("#sidebar").attr("href", "../socialapi/sidebar.html" + location.search);
});

function log() {
  var s = [];
  for (var i=0; i<arguments.length; i++) {
    s.push(JSON.stringify(arguments[i], null, 2));
  }
  s = s.join(" ");
  var el = $("<pre>").text(s);
  var li = $("<li>").append(el);
  $("#messages").append(li);
}

var hub = mixinEvents({});

var channel = WebSocketChannel(hubUrl);
channel.onmessage = function (msg) {
  log("Message", msg);
  if (msg.clientId) {
    hub.emit(msg.type, msg);
  }
};

function send(msg) {
  msg.clientId = clientId;
  channel.send(msg);
}

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

sendHello(false);

hub.on("hello", function () {
  sendHello(true);
});
