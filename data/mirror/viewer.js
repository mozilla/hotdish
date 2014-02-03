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

var style = document.createElement("style");
style.textContent = [
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
