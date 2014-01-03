if (! window.Freeze) {
  var Freeze = {};
}

Freeze.ELEMENT_NODE = document.ELEMENT_NODE;
Freeze.TEXT_NODE = document.TEXT_NODE;

Freeze.makeId = function makeId() {
  return 'el' + (makeId.counter++);
};

// This makes it more sortable:
Freeze.makeId.counter=1000;

// These elements can have e.g., clientWidth of 0 but still be relevant:
Freeze.skipElementsOKEmpty = {
  LINK: true,
  STYLE: true,
  HEAD: true,
  META: true,
  BODY: true,
  APPLET: true,
  BASE: true,
  BASEFONT: true,
  BDO: true,
  BR: true,
  OBJECT: true,
  TD: true,
  TR: true,
  TH: true,
  THEAD: true,
  TITLE: true
  // COL, COLGROUP?
};

// These are elements that are empty, i.e., have no closing tag:
Freeze.voidElements = {
  AREA: true,
  BASE: true,
  BR: true,
  COL: true,
  COMMAND: true,
  EMBED: true,
  HR: true,
  IMG: true,
  INPUT: true,
  KEYGEN: true,
  LINK: true,
  META: true,
  PARAM: true,
  SOURCE: true,
  TRACK: true,
  WBR: true
};

// These elements are never sent:
Freeze.skipElementsBadTags = {
  SCRIPT: true,
  NOSCRIPT: true
};

Freeze.skipElement = function (el) {
  /* true if this element should be skipped when sending to the mirror */
  var tag = el.tagName;
  if (Freeze.skipElementsBadTags[tag] || el.jsmirrorHide) {
    return true;
  }
  // Skip elements that can't be seen, and have no children, and are potentially
  // "visible" elements (e.g., not STYLE)
  // Note elements with children might have children with, e.g., absolute
  // positioning -- so they might not make the parent have any width, but
  // may still need to be displayed.
  if ((el.style && el.style.display == 'none') ||
      ((el.clientWidth === 0 && el.clientHeight === 0) &&
       (! Freeze.skipElementsOKEmpty[tag]) &&
       (! el.childNodes.length))) {
    return true;
  }
  return false;
};

Freeze.serializeDocument = function () {
  /* Serializes a complete document to JSON object */
  // FIXME: should I clear this.elements here?
  var doc = document;
  return {
    htmlAttrs: Freeze.serializeAttributes(doc.childNodes[0]),
    head: Freeze.serializeElement(doc.head),
    body: Freeze.serializeElement(doc.body)
  };
};

// FIXME: this is hacky:
Freeze.elementTracker = {
  elements: {}
};

Freeze.trackElement = function (el) {
  var id = el.jsmirrorId;
  if (! id) {
    id = this.makeId();
    el.jsmirrorId = id;
  }
  Freeze.elementTracker.elements[id] = el;
};

Freeze.serializeElement = function (el) {
  /* Serializes a single element to a JSON object.
     The object looks like:
       [tagName, localId, {attrs}, [children...]]
   */
  if (! el.jsmirrorId) {
    Freeze.trackElement(el);
  }
  if (el.tagName == 'CANVAS') {
    return ['IMG', el.jsmirrorId, {src: el.toDataURL('image/png')}, []];
  }
  var attrs = Freeze.serializeAttributes(el);
  var children;
  if (el.tagName == 'IFRAME') {
    children = [];
    var html;
    try {
      html = Freeze.staticHTML(el.contentWindow.document.documentElement);
    } catch (e) {
      console.warn('Had to skip iframe for permission reasons:', e+'', 'src:', el.src);
      // A placeholder for the iframe:
      return ['SPAN', el.jsmirrorId, {}, []];
    }
    attrs.src = Freeze.encodeData('text/html', html);
  } else {
    children = Freeze.normalChildren(el);
    var length = children.length;
    for (var i=0; i<length; i++) {
      var child = children[i];
      if (typeof child !== 'string') {
        children[i] = Freeze.serializeElement(children[i]);
      }
    }
  }
  var result = [el.tagName, el.jsmirrorId, attrs, children];
  return result;
};

Freeze.normalChildren = function (el) {
  // Returns a normalized representation of a set of children, as
  // as a list of text and elements, with no two adjacent text elements
  // and no empty text strings.  Ignorable elements are omitted.
  var result = [];
  var children = el.childNodes;
  var length = children.length;
  for (var i=0; i<length; i++) {
    var child = children[i];
    if (this.skipElement(child)) {
      continue;
    }
    if (child.nodeType == Freeze.TEXT_NODE) {
      var value = child.nodeValue;
      if (! value) {
        continue;
      }
      if (result.length && typeof result[result.length-1] == 'string') {
        // Append this text to the last
        result[result.length-1] += value;
      } else {
        result.push(value);
      }
    } else if (child.nodeType == Freeze.ELEMENT_NODE) {
      result.push(child);
    }
  }
  return result;
};

Freeze.serializeAttributes = function (el) {
  /* Serialize the attributes of an element into a JSON object */
  var attrs = {};
  if (el.attributes) {
    var length = el.attributes.length;
    for (var i=0; i<length; i++) {
      var attrName = el.attributes[i].name;
      if (attrName.substr(0, 2).toLowerCase() == "on") {
        // Don't keep any event-based attributes
        continue;
      } else if (attrName == 'href' || attrName == 'src' || attrName == 'value') {
        // Dereference these fancy-like, which should make them absolute
        attrs[attrName] = el[attrName];
      } else {
        attrs[attrName] = el.attributes[i].nodeValue;
      }
    }
  }
  if (el.tagName == 'TEXTAREA') {
    // This doesn't show up as an attribute
    // FIXME: Perhaps all INPUT elements should get this treatment?
    attrs.value = el.value;
  }
  return attrs;
};

Freeze.compareAttributes = function (attrs, el) {
  /* Returns true if serializeAttributes(el) would produce attrs */
  var count = 0;
  var tagName = el.tagName;
  for (var i in attrs) {
    if (! attrs.hasOwnProperty(i)) {
      continue;
    }
    count++;
    var value;
    if (i == 'href' || i == 'src' || i == 'value') {
      value = el[i];
      if (! el.hasAttribute(i)) {
        // This happens in particularly with a virtual "value" attribute
        count--;
      }
    } else {
      value = el.getAttribute(i);
    }
    if (value != attrs[i]) {
      console.log('got diff in attributes', i);
      return false;
    }
  }
  var elAttrsLength = el.attributes.length;
  if (elAttrsLength == count) {
    return true;
  }
  // There might be "blocked" attributes
  for (i=0; i<elAttrsLength; i++) {
    var attr = el.attributes[i];
    if (attr.name.substr(0, 2).toLowerCase() == 'on') {
      count++;
    }
  }
  return count == elAttrsLength;
};

Freeze.compareAttributes2 = function (attrs, el) {
  var elAttrs = this.serializeAttributes(el);
  var result = true;
  var i;
  for (i in attrs) {
    if (attrs[i] != elAttrs[i]) {
      result = false;
    }
  }
  for (i in elAttrs) {
    if (attrs[i] != elAttrs[i]) {
      result = false;
    }
  }
  var otherResult = this.compareAttributes(attrs, el);
  if (result != otherResult) {
    console.log('Disagreement', el.tagName, result, otherResult);
  }
  return result;
};

Freeze.htmlQuote = function (s) {
  /* Does minimal quoting of a string for embedding as a literal in HTML */
  if (! s) {
    return s;
  }
  if (s.search(/[&<"]/) == -1) {
    return s;
  }
  return s.replace(/&/g, "&amp;").replace(/</g, '&lt;').replace(/"/g, "&quot;");
};

Freeze.encodeData = function (content_type, data) {
  /* Encodes the given data as a data: URL */
  // FIXME: utf8?  URL-save base64?
  return 'data:' + content_type + ';base64,' + btoa(data);
};

Freeze.staticHTML = function (el) {
  /* Converts the element to static HTML, dropping anything that isn't static */
  if (el.tagName == 'CANVAS') {
    return '<IMG SRC="' + this.htmlQuote(el.toDataURL('image/png')) + '">';
  }
  var replSrc = null;
  if (el.tagName == 'IFRAME') {
    // FIXME: need to add <base> element
    try {
      var html = this.staticHTML(el.contentWindow.document.documentElement);
      replSrc = this.encodeData('text/html', html);
    } catch (e) {
      console.warn('Had to skip iframe for permission reasons:', e+'');
    }
  }
  var s = '<' + el.tagName;
  var attrs = el.attributes;
  var l;
  if (attrs && (l = attrs.length)) {
    for (var i=0; i<l; i++) {
      var name = attrs[i].name;
      if (name.substr(0, 2).toLowerCase() == "on") {
        continue;
      }
      var value;
      if (name == 'src' && replSrc) {
        value = replSrc;
      } else if (name == "href" || name == "src" || name == "value") {
        value = el[name];
      } else {
        value = attrs[i].nodeValue;
      }
      // FIXME: should the name be quoted in any fashion?
      s += ' ' + name + '="' + this.htmlQuote(value) + '"';
    }
  }
  s += '>';
  if (! this.voidElements[el.tagName]) {
    s += this.staticChildren(el);
    s += '</' + el.tagName + '>';
  }
  return s;
};

Freeze.getAttributes = function (el) {
  var result = [];
  var attrs = el.attributes;
  if (attrs && attrs.length) {
    var l = attrs.length;
    for (var i=0; i<l; i++) {
      var name = attrs[i].name;
      if (name.substr(0, 2).toLowerCase() == "on") {
        continue;
      }
      var value;
      if (name == "href" || name == "src" || name == "value") {
        value = el[name];
      } else {
        value = attrs[i].nodeValue;
      }
      result.push([name, value]);
    }
  }
  return result;
};

Freeze.staticChildren = function (el) {
  /* Converts all the children of the given element to static HTML */
  var s = '';
  var children = el.childNodes;
  var l = children.length;
  for (var i=0; i<l; i++) {
    var child = children[i];
    if (this.skipElement(child)) {
      continue;
    }
    if (child.nodeType == this.TEXT_NODE) {
      var value = child.nodeValue;
      s += this.htmlQuote(value);
    } else if (child.nodeType == this.ELEMENT_NODE) {
      s += this.staticHTML(child);
    }
  }
  return s;
};


Freeze.diffDocuments = function (orig, current, commands) {
  if (! current) {
    throw 'Got bad current argument: ' + current;
  }
  if (commands === undefined) {
    commands = [];
  }
  if (! current.jsmirrorId) {
    console.warn("Got diffDocuments element without an id", current);
    current.jsmirrorId = Freeze.makeId();
    this.elements[current.jsmirrorId] = current;
  }
  var origTagName = orig[0];
  var origId = orig[1];
  var origAttrs = orig[2];
  var origChildren = orig[3];
  var origInnerHTML = orig[4];
  if (origTagName != current.tagName) {
    // We can't diff a tag that doesn't match
    console.warn('got tag name change', origTagName, current.tagName);
    return null;
  }
  if (! Freeze.compareAttributes(origAttrs, current)) {
    commands.push(['attrs', current.jsmirrorId, Freeze.serializeAttributes(current)]);
  }
  if (origId != current.jsmirrorId) {
    // This shouldn't happen
    console.warn("Tag ids don't match", origId, current.jsmirrorId, current);
    return null;
  }
  if (origInnerHTML !== undefined && current.innerHTML == origInnerHTML) {
    // Deep comparison matches
    return commands;
  }
  var curChildren = Freeze.normalChildren(current);
  var curLength = curChildren.length;
  var origLength = origChildren.length;
  if (curLength === 1 && origLength === 1 &&
      typeof curChildren[0] === "string" && typeof origChildren[0] === "string") {
    // A special case of an element with just one string child
    if (origChildren[0] !== curChildren[0]) {
      commands.push(["replace_text", current.jsmirrorId, curChildren[0]]);
    }
    return commands;
  }
  var i;
  var origPos = 0;
  var curPos = 0;
  while (origPos < origLength || curPos < curLength) {
    // If two equal strings, walk forward
    if (typeof origChildren[origPos] == "string" &&
        origChildren[origPos] === curChildren[curPos]) {
      origPos++;
      curPos++;
      continue;
    }
    var nextPos = Freeze.findNextMatch(origChildren, curChildren, origPos, curPos);
    if (nextPos === null) {
      // No more matches, so we need to add everything up to the end
      nextPos = [origLength, curLength];
    }
    var origNext = nextPos[0];
    var curNext = nextPos[1];
    if (origPos < origNext) {
      // We have to delete some orig children
      if (origPos + 1 == origNext && typeof origChildren[origPos] == "string") {
        // Only a string has changed
        if (origNext >= origLength) {
          commands.push(["delete_last_text", current.jsmirrorId]);
        } else {
          commands.push(["deletetext-", origChildren[origPos+1][1]]);
        }
      } else {
        // Some elements have to be deleted
        var startText = typeof origChildren[origPos] == "string";
        for (i=origPos; i<origNext; i++) {
          if (typeof origChildren[i] == "string") {
            continue;
            }
          var command = "delete";
          if (i == origPos+1 && startText) {
            command += "-";
          }
          if (i+1 < origChildren && typeof origChildren[i+1] == "string") {
            command += "+";
          }
          commands.push([command, origChildren[i][1]]);
        }
      }
    }
    if (curPos < curNext) {
      // We have to insert some new children
      var pushes = [];
      for (i=curPos; i<curNext; i++) {
        if (typeof curChildren[i] == "string") {
          pushes.push(curChildren[i]);
        } else {
          Freeze.trackElement(curChildren[i]);
          pushes.push(Freeze.serializeElement(curChildren[i]));
        }
      }
      if (curChildren[curNext]) {
        commands.push(["insert_before", curChildren[curNext], pushes]);
      } else {
        commands.push(["append_to", current.jsmirrorId, pushes]);
      }
    }
    if (origChildren[origNext]) {
      Freeze.diffDocuments(origChildren[origNext], curChildren[curNext], commands);
    }
    curPos = curNext+1;
    origPos = origNext+1;
  }
  return commands;
};

Freeze.findNextMatch = function (origChildren, curChildren, origStart, curStart) {
  if (origStart >= origChildren.length || curStart >= curChildren.length) {
    return null;
  }
  while (typeof curChildren[curStart] == "string" ||
         (! curChildren[curStart].jsmirrorId)) {
    curStart++;
    if (curStart >= curChildren.length) {
      // There's nothing with an id
      return null;
    }
  }
  // First we see if we can find a match for curStart in origChildren
  var check = origStart;
  var checkId = curChildren[curStart].jsmirrorId;
  if (! checkId) { // FIXME: why is this if statement here
    while (check < origChildren.length) {
      if (typeof origChildren[check] != "string" && checkId == origChildren[check][1]) {
        return [check, curStart];
      }
      check++;
    }
  }
  // We didn't find a match, so we'll try to find a match for the origStart in curChildren
  // This should never really go more than one loop
  while (typeof origChildren[origStart] == "string") {
    origStart++;
    if (origStart >= origChildren.length) {
      // There's no more elements
      return null;
    }
  }
  checkId = origChildren[origStart][1];
  check = curStart;
  while (check < curChildren.length) {
    if (typeof curChildren[check] != "string" &&
        checkId == curChildren[check].jsmirrorId) {
      return [origStart, check];
    }
    check++;
  }
  // Fell out of the loop - nothing matched, so we'll try later elements all around
  return Freeze.findNextMatch(origChildren, curChildren, origStart+1, curStart+1);
};

Freeze.applyDiff = function (commands, onFault) {
  var pushes, j, child;
  for (var i=0; i<commands.length; i++) {
    var command = commands[i];
    var name = command[0];
    var el = Freeze.getElement(command[1]);
    if (! el) {
      console.warn('Got diff command for element that does not exist', command);
      if (onFault) {
        onFault(command);
      }
      continue;
    }
    if (name === 'attrs') {
      Freeze.setAttributes(el, command[2]);
    }
    if (name === 'deletetext-' || name === 'delete-' || name == 'delete-+') {
      while (el.previousSibling && el.previousSibling.nodeType == document.TEXT_NODE) {
        el.parentNode.removeChild(el.previousSibling);
      }
    }
    if (name === 'delete+') {
      while (el.nextSibling && el.nextSibling.nodeType == document.TEXT_NODE) {
        el.parentNode.removeChild(el.nextSibling);
      }
    }
    if (name === 'delete' || name === 'delete-' || name === 'delete+' || name === 'delete-+') {
      el.parentNode.removeChild(el);
    }
    if (name === 'delete_last_text') {
      if (el.childNodes.length) {
        var lastEl = el.childNodes[el.childNodes.length-1];
        if (lastEl.nodeType != document.TEXT_NODE) {
          console.warn("Got command that deletes something that isn't text", command, lastEl);
          if (onFault) {
            onFault(command);
          }
          continue;
        } else {
          el.removeChild(lastEl);
        }
      } else {
        console.warn("Tried to delete_last_text of element with no children", command);
        if (onFault) {
          onFault(command);
        }
        continue;
      }
    }
    if (name === 'replace_text') {
      if (el.childNodes.length !== 1 || el.childNodes[0].nodeType !== document.TEXT_NODE) {
        while (el.childNodes) {
          el.removeChild(el.childNodes[0]);
        }
        el.appendChild(document.createTextNode(command[2]));
      } else {
        el.childNodes[0].nodeValue = command[2];
      }
    }
    if (name === 'insert_before') {
      pushes = command[2];
      for (j=pushes.length-1; j>=0; j--) {
        if (typeof pushes[j] == 'string') {
          child = document.createTextNode(pushes[j]);
        } else {
          child = Freeze.deserializeElement(pushes[j]);
        }
        el.parentNode.insertBefore(child, el);
      }
    }
    if (name === 'append_to') {
      pushes = command[2];
      for (j=0; j<pushes.length; j++) {
        if (typeof pushes[j] == 'string') {
          child = document.createTextNode(pushes[j]);
        } else {
          child = Freeze.deserializeElement(pushes[j]);
        }
        el.appendChild(child);
      }
    }
  }
};


Freeze.unfreeze = function (el, serialized) {
  /* Takes an element and changes it to match the serialized (JSON) version of
     that element */
  var tagName = serialized[0];
  var jsmirrorId = serialized[1];
  var attrs = serialized[2];
  var children = serialized[3];
  if (el.tagName != tagName) {
    // Heck with it, recreate the element entirely
    el.parentNode.replaceChild(Freeze.deserializeElement(serialized), el);
    return;
  }
  Freeze.setAttributes(el, attrs);
  el.jsmirrorId = jsmirrorId;
  var offset = 0;
  for (var i=0; i<children.length; i++) {
    var childIndex = i + offset;
    var existing = el.childNodes[childIndex];
    if (! existing) {
      el.appendChild(Freeze.deserializeElement(children[i]));
    } else if (existing.jsmirrorHide || existing.id == 'webSocketContainer') {
      offset++;
      i--;
      continue;
    } else if (typeof children[i] == 'string') {
      if (existing.nodeType != document.TEXT_NODE) {
        existing.parentNode.replaceChild(document.createTextNode(children[i]), existing);
      } else {
        existing.nodeValue = children[i];
      }
    } else {
      Freeze.unfreeze(existing, children[i]);
    }
  }
  while (el.childNodes.length - offset > children.length) {
    var node = el.childNodes[children.length + offset];
    if (node.jsmirrorHide) {
      offset++;
      continue;
    }
    el.removeChild(node);
  }
};

Freeze.deserializeElement = function (data) {
  /* Creates an element to match the given data */
  if (typeof data == 'string') {
    return document.createTextNode(data);
  }
  var tagName = data[0];
  var jsmirrorId = data[1];
  var attrs = data[2];
  var children = data[3];
  var el;
  var text;
  var i;
  if (tagName == '<!--COMMENT-->') {
    if (children && children.length) {
      text = children[0];
    } else {
      text = "";
    }
    el = document.createComment(text);
    el.jsmirrorId = jsmirrorId;
    return el;
  }
  el = document.createElement(tagName);
  try {
    for (i in attrs) {
      if (attrs.hasOwnProperty(i)) {
        el.setAttribute(i, attrs[i]);
      }
    }
  } catch (e) {
    console.warn('bad attrs', attrs, JSON.stringify(attrs));
  }
  if (children === undefined) {
    console.warn('Bad children', data);
    throw 'Bad children list';
  }
  for (i=0; i<children.length; i++) {
    var o = children[i];
    if (typeof o == "string") {
      el.appendChild(document.createTextNode(o));
    } else {
      el.appendChild(Freeze.deserializeElement(o));
    }
  }
  el.jsmirrorId = jsmirrorId;
  return el;
};

Freeze.setAttributes = function (el, attrs) {
  /* Makes an element's attributes match the given JSON attributes */
  var attrLength = 0;
  for (var i in attrs) {
    if (! attrs.hasOwnProperty(i)) {
      continue;
    }
    attrLength++;
    el.setAttribute(i, attrs[i]);
    if (i == 'value') {
      el.value = attrs[i];
    }
  }
  if (! el.attributes) {
    console.log('el.attributes?', el, el.tagName);
    return;
  }
  if (el.attributes.length > attrLength) {
    // There must be an extra attribute to be deleted
    var toDelete = [];
    for (i=0; i<el.attributes.length; i++) {
      if (! attrs.hasOwnProperty(el.attributes[i].name)) {
        toDelete.push(el.attributes[i].name);
      }
    }
    for (i=0; i<toDelete.length; i++) {
      console.debug('removing attr', toDelete[i]);
      el.removeAttribute(toDelete[i]);
    }
  }
};

Freeze.setBase = function (baseHref) {
  /* Sets the <base href> of the document */
  var existing = document.getElementsByTagName('base');
  for (var i=0; i<existing.length; i++) {
    existing[i].parentNode.removeChild(existing[i]);
  }
  var base = document.createElement('base');
  base.href = baseHref;
  document.head.appendChild(base);
};

Freeze.getElement = function (id) {
  return Freeze.elementTracker.elements[id];
};

Freeze.refreshElements = function () {
  var elements = Freeze.elementTracker.elements = {};
  function recur(el) {
    elements[el.jsmirrorId] = el;
    for (var i=0; i<el.childNodes.length; i++) {
      var child = el.childNodes[i];
      if (child.nodeType === Freeze.ELEMENT_NODE) {
        recur(child);
      }
    }
  }
  recur(document.head);
  recur(document.body);
};
