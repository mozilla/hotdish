/* Acts as a kind of echoing websocket */

function startProxier(address) {
  var channel = null;
  var channelAddress = null;
  var closing = false;
  var closer = null;
  channel = new WebSocketChannel(address);
  closer = PortIncomingChannel(channel);
}

self.port.on("StartProxier", startProxier);
