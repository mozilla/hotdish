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

1. Click https://togetherjs.com/hotdish/hotdish.xpi (if you downloaded from a people.mozilla.org link you got a really old version!)
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

This is developed as a Firefox addon, requiring Firefox 26 or later. We do development both on the released version of Firefox and on [Firefox Nightly](http://nightly.mozilla.org/).

The addon uses the [Addon-SDK](https://addons.mozilla.org/en-US/developers/docs/sdk/latest/). We are using the `firefox26` branch, you should get it like:

    $ git clone -b firefox26 git://github.com/mozilla/addon-sdk.git

I'd recommend adding a script like this to your `~/bin/` or other place on your path:

    #!/bin/sh
    exec ~/[checkouts]/addon-sdk/bin/cfx "$@"

Additionally you must install the `jsx` command from [Facebook React](http://facebook.github.io/react/).  Install like:

    $ npm install -g react-tools

We have a script in `bin/run` ([source](https://github.com/mozilla/hotdish/blob/master/bin/run)) which we use for development.  It does some building (specifically the [jsx file](https://github.com/mozilla/hotdish/blob/master/data/sidebar/jsx/components.js)). It also starts the Add-on SDK `cfx` command, and so starts a browser with the addon setup.  You can use `bin/run -h` to always get an up-to-date list of options.

This also starts up Hotdish in our `hotdishgroup` group, which is what we all use for development and... everything.  So you'll get to say hi!  Though somewhat peculiar, seeing the development patterns of other people is also fun.

If you make any changes you'll need to restart the browser to see those changes -- including even changes to content in the `data/` directory.

If you want to test something that involves two browsers communicating, you can use `bin/run` to start two browsers with different profiles.  Use `bin/run -2` (in a separate console) to start up a second instance.  We find it is useful to change the preferences under *General* to *When Firefox starts: Show my windows and tabs from last time*.
