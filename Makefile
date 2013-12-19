#/* This Source Code Form is subject to the terms of the Mozilla Public
# * License, v. 2.0. If a copy of the MPL was not distributed with this
# * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

VERSION ?= $(shell python -c "import json;print json.load(open('package.json'))['version']")
TOP ?= $(shell pwd)
FOX=Aurora

# see http://stackoverflow.com/questions/649246/is-it-possible-to-create-a-multi-line-string-variable-in-a-makefile
define HELPDOC

  version   - print version (according to `package.json`)
  help      - this help.

  addon     - make the addon
  push      - push to glind pmo
  deps      - get dependencies
  test      - calls both 'simple' and 'complex' tests

Note:  some targets are in the make file, some stuff is in `cfx`

endef
export HELPDOC

version:
	@echo $(VERSION)

help:
	@echo "$$HELPDOC"

deps:
	# wget micropilot
	#curl https://raw.github.com/gregglind/micropilot/dev/lib/micropilot.js > lib/micropilot.js
	# wget bwclarks thing
	#curl https://raw.github.com/gregglind/browser-search-engine/master/lib/browser-search-engine.js > lib/browser-search-engine.js

addon: deps
	cd $(TOP)
	rm -f hotdish.xpi hotdish.update.rdf
	cfx xpi \
		--update-link https://people.mozilla.com/~glind/hotdish.xpi \
		--update-url https://people.mozilla.com/~glind/hotdish.update.rdf $(OPTS)

push: addon
	cd $(TOP)
	scp hotdish.update.rdf hotdish.xpi $(WHO)people.mozilla.com:~/www/
