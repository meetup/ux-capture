# UX Capture

Browser instrumentation helper that makes it easier to capture UX speed metrics.

<!-- TOC depthFrom:2 depthTo:6 orderedList:false updateOnSave:true withLinks:true -->

- [Project Goals](#project-goals)
- [JS library](#js-library)
  - [Features](#features)
  - [Configuring UX capture library (first prototype)](#configuring-ux-capture-library-first-prototype)
    - [Setting Custom Handlers](#setting-custom-handlers)
  - [Sample page](#sample-page)
  - [Release notes](#release-notes)
- [Instrumentation](#instrumentation)
  - [Individual Element Instrumentation](#individual-element-instrumentation)
    - [Image elements](#image-elements)
    - [Text without custom font](#text-without-custom-font)
    - [Event handler attachment](#event-handler-attachment)
  - [Aggregating component metrics](#aggregating-component-metrics)
  - [Aggregating experience/perception phase metrics](#aggregating-experienceperception-phase-metrics)
- [Testing results](#testing-results)
- [Glossary](#glossary)

<!-- /TOC -->

## Project Goals

There are multiple goals for this project, all dictated by lack of instrumentation inside human brains and lack of real rendering instrumentation of painting events in the browser (closes thing to human's eyes that we currently have).

- Capture display (e.g. paint) and interactivity (e.g. click handlers attached) events for various elements of web view (e.g. images, text, video, fonts, buttons, etc.)
- Group together multiple display events for elements of web page that represent same design/product components
- Group together multiple components to reflect various experience/perception phases that user goes through and we hope to achieve on the page
- Collect captured events and [_UX speed metrics_](#UX_speed_metrics "metrics representing speed of the human-computer interface as it is perceived by the user") for all users using RUM (Real User Measurement) tools
- Calibrate in-browser instrumentation by recording page load video using synthetic tools and deriving same [_UX speed metrics_](#UX_speed_metrics "metrics representing speed of the human-computer interface as it is perceived by the user")
- Create uniform instrumentation for both [_page views_](#page_view "view resulting in full browser navigation and re-creation of browser DOM") and [_interactive views_](#interactive_view "view resulting in partial updates of browser DOM"), to be usable with any back-end and front-end framework
- Future compatibility with [Element Timing API](https://github.com/w3c/charter-webperf/issues/30) that aims at adding instrumentation directly into browser

## JS library

The intent of this library is to help developers group several technical events that they would instrument their pages with into "zones" which, once presented to the user represent completion of "phases" of page load representing [distinct stages](#aggregating-experienceperception-phase-metrics) of user experience.

### Features

- :ballot_box_with_check: Record individual events (marks) ([#3](https://github.com/sergeychernyshev/ux-capture/issues/3))
- :ballot_box_with_check: Group marks into zones ([#1](https://github.com/sergeychernyshev/ux-capture/issues/1))
  - :ballot_box_with_check: Wait for all events and record a groups of events (measures) ([#1](https://github.com/sergeychernyshev/ux-capture/issues/1))
- :ballot_box_with_check: Chrome timeline support ([#2](https://github.com/sergeychernyshev/ux-capture/issues/2))
- :white_large_square:Support adding items to zone as page loads (e.g. after initial initialization lower on the page, e.g. when server-side framework requires more granular control, e.g. instrumentation is only know inside included file lower than the header. Must happen definitely before at least on of the marks in the same zone fire completing the zone.) ([#7](https://github.com/sergeychernyshev/ux-capture/issues/7))
- :white_large_square:Allow replacing categories/placeholders with specific marks (e.g. when specific marks and their number is known only after an AJAX call or other time-consuming execution) ([#8](https://github.com/sergeychernyshev/ux-capture/issues/8))
- :white_large_square:Fire an optional callback when all zones are complete (e.g. to report numbers before the automated beacon, which listens for other things fires) ([#10](https://github.com/sergeychernyshev/ux-capture/issues/10))
- :white_large_square:Ensure there is no double-reporting between automated external beacon and completion callback beacon (e.g. define unique pageview ID)
- :ballot_box_with_check:Fire an optional callback on each mark to allow for custom recording ([#11](https://github.com/sergeychernyshev/ux-capture/issues/11))
- :ballot_box_with_check:Fire an optional callback on each measure to allow for custom recording ([#12](https://github.com/sergeychernyshev/ux-capture/issues/12))
- :ballot_box_with_check:Use feature-detection for browser APIs (NavTiming, UserTiming and console.timeStamp) ([#9](https://github.com/sergeychernyshev/ux-capture/issues/9))
- :white_large_square:Report when zones are not complete before beacon fires / navigation happens in interactive view
- :white_large_square:Support customizing namespace for the API singleton, e.g. MYUX.mark() instead of UX.mark()
- :white_large_square:Support SPA applications that navigate between views (and optionally use history API to update browser URLs without deconstructing the DOM)
- :white_large_square:Framework bindings for easier integration
  - :white_large_square:React
- :white_large_square:Sample pages illustrating instrumentation
  - :ballot_box_with_check:basic ([#5](https://github.com/sergeychernyshev/ux-capture/issues/5))
  - :white_large_square:advanced

### Configuring UX capture library (first prototype)

WARNING: current version of the library is a first prototype that only works in modern browsers that support ES6 and all the necessary browser APIs, DO NOT USE IN PRODUCTION!

Inline the library into HTML using server-side include technology appropriate for your platform:

```php
<head>
    <title>My Page</title>
...
```

It is important to have this code available very early on the page as we need to instrument events that happen as early as HTML parsing and waiting for network might artificially skew events timings on the page and lead to race conditions. Future versions might remove this dependency by queueing up the calls.

After library is included, call `expect()` method on global `UX` object passing an array of all (future versions will change that) the expected zone configurations like so:

```html
    <script>
        UX.expect([
            {
                name: "ux-verify-destination",
                marks: ["ux-text-title"]
            },
            {
                name: "ux-primary-content",
                marks: ["ux-text-intro", "ux-text-story", "ux-image-onload-kitten", "ux-image-inline-kitten"]
            },
            {
                name: "ux-primary-action",
                marks: ["ux-text-story-details-link", "ux-handler-moreclickable"]
            },
            {
                name: "ux-secondary-content",
                marks: ["ux-text-page2"]
            }
        ]);
    </script>
</head>
```

Each individual zone configuration object contains of zone's `name` that will be used as a name of corresponding [W3C UserTiming API `measure`](https://www.w3.org/TR/user-timing/#performancemeasure) and `marks` array of individual event name strings that zone groups together, each individual name will be used when recording corresponding events as [W3C UserTiming API `mark`](https://www.w3.org/TR/user-timing/#performancemark).

#### Setting Custom Handlers

In cases when monitoring solution you use does not support W3C UserTiming API natively, you might want to provide a custom method of recording the results.

You can do that by specifying custom handlers for `mark` and `measure` events which will read data from UserTiming API, format the results accordingly and pass them to your service.

To accomplish that, you can call `UX.config()` method and pass it a configuration object. Following keys are currently supported:

- `onMark` - provides a custom handler to be called every time a mark is recorded with the name of the mark as only argument
- `onMeasure` - provides a custom handler to be called every time a measure is recorded with the name of the measure as only argument

### Sample page

This repository contains a sample page that implements basic instrumentation for your reference:
https://cdn.rawgit.com/sergeychernyshev/ux-capture/master/js/index.html

### Release notes

- v2.0.0 (October 9, 2018)
  - BREAKING CHANGE: updated expected zone configuration to use `name` instead of `label` as key to align with timing API conventions. Update your expect calls.
  - Now using webpack for bundling. No more source file to use, make sure to inline `js/ux-capture.min.js` file in your HTML.
  - Fixed a bug with hanging measures if mark is used in multiple places.
  - Replaced Promises with callbacks internally to simplify testing and allow for more complex logic in the future.

## Instrumentation

### Individual Element Instrumentation

Each element that needs to be instrumented might require multiple snippets of code injected into a page to measure several events which in turn are aggregated into element-level measurements using _element aggregation algorythm_ (can vary for different element instrumentation methods, but "latest of events" is generally a good default).

Number of snippets and exact code to be added to the page depends on the type of element being measured and must be determined experimentally or discovered in industry white papers or blogs as there is currently no direct method of instrumenting the display timings in modern browsers.

Below is the list of instrumentation methods with examples:

#### Image elements

Image tracking requires two measurements, one within the `onload` callback of the image itself and another within inline `<script>` tag directly after the image.

```javascript
<img src="hero.jpg" onload="UX.mark('ux-image-onload-logo')">
<script>UX.mark('ux-image-inline-logo')</script>
```

Element aggregation algorythm: latest of the two (`inline` and `onload`) measurements.

References:

- Steve Souders: [Hero Image Custom Metrics](https://www.stevesouders.com/blog/2015/05/12/hero-image-custom-metrics/), published on May 12, 2015

#### Text without custom font

Text that does not use a custom font can be instrumented by supplying one inline `<script>` tag directly after the text:

```javascript
<script>UX.mark("ux-text-headline");</script>
```

Element aggregation algorythm: no aggregation, just one event.

References:

- Steve Souders: [User Timing and Custom Metrics](https://speedcurve.com/blog/user-timing-and-custom-metrics/) (example 5), published on November 12, 2015

#### Event handler attachment

Some user activity requires custom JavaScript handler code to be attached to an event on the page, e.g. `click` of the button (e.g. it's only "available" when visible AND clickable). Instrumenting handler attachment is straightforward, just include the call right after handler attachment in JavaScript code.

```javascript
var button_element = document.getElementById("mybutton");
button_element.addEventListener("click", myActionHandler);
UX.mark("ux-handler-myaction");
```

Element aggregation algorythm: no aggregation, just one event.

### Aggregating component metrics

Most design components on web page consist of multiple elements, e.g. tweet contains text, name of the person tweeting and their userpic.

On this level, it is very business-specific and needs attention of a product manager and/or graphics designer to identify. It is suggested to conduct business interviews to identify the elements and to group them into components accordingly.

Most common way / algorythm to aggregate performance metrics for individual tracked elements is to take timing of the latest element that showed up and treat it as completion timing for compoment overall, but business decision can be made to track earliest element (e.g. "as long as something is visible"), although these are less common and can create more variability in measurement.

Component-level aggregation might be an advanced detail and can be skipped early on with element timings aggregated directly into experience/perception phases, but can be useful for modularity and more detailed analysis across the system.

### Aggregating experience/perception phase metrics

It is critical to group metrics into categories that are not specific to individual pages, but can be used universally across the property and just comprised of different components / elements on each page.

Well known example of such "category" is **_first meaningful paint_** which has different meaning on differeng parts of user experience, but represents a universal improvement over "first paint" [_technical metric_](#technical_performance_metrics "performance metrics that represent time spent executing various technical components of the application as opposed to metrics representing speed of the human-computer interface as it is perceived by the user").

This can be taken further to represent user's intent in more detail. Each view can be broken down into several phases which all contribute to keeping user on task and giving them best experience in terms of percieved speed.

Here are 4 phases defining parts of experience that matter to business from different perspectives:

1.  Destination verified (`ux-destination-verified`)
2.  Primary content displayed (`ux-primary-content-displayed`)
3.  Primary action available (`ux-primary-action-available`)
4.  Secondary content displayed (`ux-secondary-content-displayed`)

Each phase's component or element metrics (marks) can be combined and reported as measures:

```javascript
// assuming logo's onload event was last to fire among all element timers for this phase
performance.measure("ux-destination-verified", 0, "ux-image-onload-logo");
```

the can be then collected using RUM beacon or using synthetic testing tool like WebPageTest or [Chrome Developer Tools' Timeline tab](https://twitter.com/igrigorik/status/690636030727159808).

This is done automatically by the library and no additional instrumentation is necessary

## Testing results

To confirm that your instrumentation was successful, open your page in Chrome Developer Tools' Performance tab and hit reload to capture the timeline.

Verify that individual marks are captured as timestamps on the timeline (small vertical lines on Frames band), hovering over each should show the name used for the mark.

Also verify that measures are captured (long horizontal bars under User Timing band, starting at navigation and ending at the last mark comprizing the zone).

Note that you might need to zoom in on the timeline to see these marks and measures.
![Chrome DevTools Performance Timeline with marks and measures](docs/basic-results-sample-chromedevtools.png)

You can also run W3C Performance Timeline API [`performance.getEntriesByType()`](https://www.w3.org/TR/performance-timeline-2/#extensions-to-the-performance-interface) method with `"mark"` and `"measure"` parameters to retrieve marks and measures respectively.

![Chrome DevTools console showing captured performance marks and measures](docs/basic-results-sample-chromedevtools-console.png)

## Glossary

<dl>
  <dt id="technical_performance_metrics">technical performance metrics</dt>
  <dd>performance metrics that represent time spent executing various technical components of the application, common examples are: TTFB (time to first byte), DOMContentLoaded, page load, but also custom metrics representing loading of particular component of execution of particular part of the code. There are metrics clearly defined by specifications as well as metrics simply perceived by community as standard, but having multiple meanings depending on person's understanding of technology stack</dd>

  <dt id="UX_speed_metrics">UX (user experience) speed metrics</dt>
  <dd>metrics representing speed of the human-computer interface as it is perceived by the user</dd>

  <dt>view</dt>
  <dd>phase of page rendering following user interaction</dd>

  <dt id="page_view">page view</dt>
  <dd>view resulting in full browser navigation and re-creation of browser DOM (technical performance metrics are captured using W3C Navigation Timing API)</dd>

  <dt id="interactive_view">interactive view</dt>
  <dd>view resulting in partial updates of browser DOM, method used in so-called "single-page application" or just as interactive part of more traditional pages, e.g. multi-step forms, etc. Custom instrumentation is required, metrics can be captured using W3C User Timing API</dd>

</dl>
