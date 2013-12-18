# Interaction Cam 

Interaction Cam is a WebRTC powered photobooth application. It is named that way because we are planning to use [MaKey MaKey](http://www.makeymakey.com/) to trigger the camera with a high-five of visitors of the [Mozilla Festival](http://mozillafestival.org/)

## Setup

The app has been tested on Chrome, Opera an Firefox Nightly 18. In order to get it to work on Chrome, you need to grant it access to the Camera and in Firefox Nightly you need to enable streaming media:

* Type `about:config` and say yes that you want to make changes
* Find the `media.navigator.enabled` entry and set it to true

## Demo 

The demo is [right here on GitHub on this repository](http://codepo8.github.com/interaction-cam/):

![screenshot](http://codepo8.github.com/interaction-cam/screenshot.png)@100


## Usage

The cam is very simple - I deliberately did not use any fancy image effects as there are enough cam examples like that out there. 

* Press space or click on the video to take a photo and get to the review
* Press the "Uh, let's try that again" button or hit the left cursor key to take another photo 
* Press the "Win! Upload this!" button or hit the right cursor key to upload the photo to imgUrl.
* Once uploaded, hit the "Take another" button or the right cursor key to take another photo

## Image uploading 

The image uploading is using the [CORS anonymous API of imgur](http://api.imgur.com/#anonapi) for storing pictures. The original code was used in the [Motivational Poster Generator](https://github.com/paulrouget/motivational) which used to be part of the Mozilla Web'o'Wonder.

If you use this, please [get your own Application Key](https://imgur.com/register/api_anon) as the API is limited to 50 images per hour!



