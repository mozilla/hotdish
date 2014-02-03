Hotdish
=======

This is an exploration social tab and general browser experience sharing.

The first exploration and prototype is being implemented as an add-on. This adds a sidebar to shared Firefox windows, which gives users a context to see each other's activity, and gives a launching point for more intimate sharing experiences.

If you use Hotdish, or are just curious about what we're doing or thinking about, please [tell us what you think](hotdish@mozilla.com).

This is developed as a Firefox addon.  We make no claims about future development, we're just trying things out.

Problems we are trying to solve/explore
-------------
* can we consolidate native productivity and communication apps/tools into something that's useful in the browser?
* can we successfully emulate the physical work place environment in a virtual ambient passive and active presence setting?
* can we make people feel more connected while working together online?
* can we bridge the gap of being alone online together?

Install/Usage
-------------

1. Click https://people.mozilla.com/~glind/hotdish.xpi
2. In Firefox, go to `View > Sidebar > Share with hotdishgroup`
3. Close the Sidebar to stop collaborating.
4. Be aware everyone in the group sees everything you open *in that window*.

Everything you do in the window with that sidebar opened will be shared with everyone else in the hotdishgroup group.

If you want to change your group, open the Addon preferences for the addon, change the group name, and restart your browser.


Find Us!
---------

[Ian Bicking](http://www.ianbicking.org), [Gregg Lind](http://writeonly.wordpress.com/), [Aaron Druck](https://www.whatthedruck.com), [Ilana Segall](https://twitter.com/Sandwichface17), and others.

Talk to us via hotdish@mozilla.com or on the #hotdish IRC channel on irc.mozilla.org

You'll probably find lots of bugs, this is pretty alpha, but [feel free to open issues](https://github.com/mozilla/hotdish/issues/new). We do all our tracking through Github issues.


Developing
----------

This is developed as a Firefox addon, requiring Firefox 26 or later, and uses the [Addon-SDK](https://addons.mozilla.org/en-US/developers/docs/sdk/latest/). You should install the [SDK from Github master](https://github.com/mozilla/addon-sdk).

You probably should use `--profiledir Profile` to keep a fixed profile as you develop Hotdish, this allows you to maintain your user settings, and if you turn on the pref for restoring tabs then you can continue your session.  Hotdish is all about dogfooding, and we encourage anyone developing it to eat its dogfood from the very beginning.

When using `cfx` you can use the `--staticargs` command-line option, which takes a JSON object as an argument.  That object accepts the arguments:

`debug: true`: turns on "debug" mode, opens the sidebar as content

`prefs: {name: value}` sets some preferences (as found in `about:config`), or `+localPref`, like `{"+username": "my name"}`

`staticAvatar: true` if true, gives you a fixed avatar (Gregg drinking coffee)

`bgTabs: [urls]` gives URLs to open in the background (to book up with some context)

`focusTab: index` focuses a particular tab (0-indexed) on startup
