document.addEventListener("click", function (event) {
  var name = event.target.tagName;
  if (name == "A" || name == "BUTTON" ||
      (name == "INPUT" && event.target.getAttribute("type") == "submit")) {
    event.preventDefault();
    return false;
  }
}, true);

document.addEventListener("focus", function (event) {
  event.preventDefault();
}, true);

// #239 adding transparent div on the body if you're a spectator so you can't do anything on the page.
// var transparentDiv = document.createElement("div");
// transparentDiv.id = 'hotdishTransparentDiv';
// transparentDiv.style.cssText = 'position:fixed;width:100%;height:100%;z-index:9999;background:none;top:0;right:0;bottom:0;left:0;';
// transparentDiv.jsmirrorHide = true;
// document.getElementsByTagName('body')[0].appendChild(transparentDiv);
// transparentDiv.innerHTML = "";

var style = document.createElement("style");
style.textContent = [
  //If you're a spectator, your cursor should :not-allowed
  "* {",
  "  cursor: not-allowed;",
  "}",
  ".togetherjs-cursor {",
  // I don't think this does anything:
  "  cursor: not-allowed;",
  "}"
].join("\n");
style.jsmirrorHide = true;
document.head.appendChild(style);

var viewer = document.getElementById("viewer");
viewer.parentNode.removeChild(viewer);
