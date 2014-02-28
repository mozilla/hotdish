/* Acts as a kind of echoing websocket */

var channel = null;
var onTerminateSend;

function startProxier(address) {
  var channelAddress = null;
  var closing = false;
  var closer = null;
  channel = new WebSocketChannel(address);
  closer = PortIncomingChannel(channel);
}

self.port.on("StartProxier", startProxier);

self.port.on("onTerminateSend", function (msg) {
  onTerminateSend = msg;
});

self.port.emit("ready");

window.addEventListener("unload", function () {
  if (onTerminateSend) {
    channel.send(onTerminateSend);
  }
});
