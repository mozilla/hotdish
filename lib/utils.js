exports.assert = function (cond) {
  if (! cond) {
    var args = Array.prototype.slice.call(arguments, 1);
    console.warn(["Assertion Error:"].concat(args));
    throw new Error("Assertion Error: " + args.join(" "));
  }
};
