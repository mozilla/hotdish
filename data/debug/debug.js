var match = /group=(.*)/.exec(location.href);
var groupId = match[1];
var hubUrl = "https://hub.togetherjs.com/hub/" + groupId;

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

var channel = WebSocketChannel(hubUrl);
channel.onmessage = function (msg) {
  log("Message", msg);
};
