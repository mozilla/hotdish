var match = /groupId=([^&]*)/.exec(location.href);
var groupId = match[1];
var hubUrl = "https://hub.togetherjs.com/hub/" + ("hotdish_" + groupId);
var channel = WebSocketChannel(hubUrl);
channel.onmessage = function (msg) {
  logMessage(msg);
};

function Logger(container, echo) {
  container = $(container);
  if (! container.length) {
    throw new Error("Bad container");
  }
  function log() {
    if (echo) {
      console.log.apply(console, arguments);
    }
    var s;
    if (arguments.length == 1 && typeof arguments[0] == "object") {
      s = JSON.stringify(arguments[0], null, 2);
      s = s.split(/\n/g);
      s.splice(0, 1);
      s.splice(s.length-1, 1);
      s = s.map(function (i) {
        i = i.replace(/^ /, "");
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
    li[0].scrollIntoView();
  }
  return log;
}

var logMessage;

$(function () {
  logMessage = Logger("#messages");
  logMessage("Opened connection to " + hubUrl);
});
