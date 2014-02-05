var editor;
var buffer = [];

function getLineLength() {
  return editor.ace_getRep().lines.length();
}

function insertAtEnd(text) {
  var lastLine = getLineLength() - 1;
  unsafeWindow.padeditor.ace.replaceRange([lastLine, 0], [lastLine, 0], text + "\n");
}

var findEditorTimeout = setInterval(function () {
  if (! unsafeWindow.padeditor) {
    return;
  }
  // If we start doing stuff with the editor before it is fully ready things
  // get stuck.  So, check for this element to see if we're done loading:
  var loader = document.querySelector("#editorloadingbox");
  if (loader && loader.clientWidth) {
    return;
  }
  unsafeWindow.padeditor.ace.callWithAce(function (x) {
    editor = x;
    clearTimeout(findEditorTimeout);
    buffer.forEach(function (msg) {
      processMessage(msg);
    });
    buffer = null;
  });
}, 100);

self.port.on("internalMessage", processMessage);

function processMessage(msg) {
  if (! editor) {
    buffer.push(msg);
    return;
  }
  if (["pageshow", "tab-init", "chat"].indexOf(msg.type) == -1) {
    // Not something we're interested in
    return;
  }
  var current = unsafeWindow.padeditor.ace.exportText();
  var text;
  if (msg.type == "pageshow") {
    var link = msg.tab.url;
    if (current.indexOf(link) == -1) {
      text = link;
    }
  } else if (msg.type == "tab-init") {
    text = [];
    msg.tabs.forEach(function (t) {
      var link = t.url;
      if (current.indexOf(link) == -1) {
        text.push(link);
      }
    });
    if (text.length) {
      text = text.join("\n");
    } else {
      text = null;
    }
  } else if (msg.type == "chat") {
    text = '"' + msg.text + '"';
  }
  if (text) {
    insertAtEnd(text);
  }
}

self.port.emit("ready");
