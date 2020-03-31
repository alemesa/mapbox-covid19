<h1>How to create a COVID-19 Map with Mapbox and React</h1>

In the current state of the world 🗺️ and with many countries in lockdown this is a good time to learn how to create a COVID-19 map like the [Hopkins Dashboard](https://gisanddata.maps.arcgis.com/apps/opsdashboard/index.html#/bda7594740fd40299423467b48e9ecf6). Our map will be simpler, is up to you to add more features.

This is what we will build ⭐https://mapbox-covid19.netlify.com/, thanks to Mapbox ease of use this is a lot easier than you might think.

🗒️`NOTE`: I will use React because is my favorite framework/library and scss for writing css.

This will be a long tutorial but if you have no patience like me... here are all the links you need, and also scroll to the bottom for an extended list of resources or click this 👉 <a href="#resources">link</a>.

---

🔗**Links**:

`Live Demo`: https://mapbox-covid19.netlify.com/

`Github Repo`: https://github.com/alemesa/mapbox-covid19

`CodeSandbox`: https://codesandbox.io/s/mapbox-covid19-8sni6 (using the access key from Mapbox tutorial lol - might stop working at some point)

`COVID-19 🦠 Data`: https://docs.corona.lmao-xd.wtf/version-2

<h2 id="tutorial">Tutorial</h2>

Let's get started with the tutorial

| You can skip to each step using this menu.

<ul>
<li><a href="#initial_setup">1. Initial Setup</a></li>
<li><a href="#setup_mapbox">2. Setup Mapbox</a></li>
<li><a href="#add_data">3. Add COVID-19 data</a></li>
<li><a href="#scale_data">4. Scale and colorize circles</a></li>
<li><a href="#tooltips">5. Add tooltips on hover</a></li>
<li><a href="#complete_code">6. Complete Code</a></li>
</ul>

---

<h3 id="initial_setup">1. Initial Setup</h3>

```sh
# Create a new folder using create-react-app and cd into it
npx create-react-app mapbox-covid
cd mapbox-covid
# Packages we will use across this tutorial
npm i node-sass mapbox-gl swr country-code-lookup
# Start a local server
npm i && npm start
```

Go to [localhost:3000](http://localhost:3000/)

Now you're all set with React and all the packages for this tutorial

Next up: Clean up all the files that come by default, especially do this:

- remove everything from App.js
- remove everything from App.css
- rename App.css to App.scss to use sass

You can also follow along with this [Codesandbox](https://codesandbox.io/s/mapbox-covid19-init-3pg2t) which has everything set up, including the css and an empty map initialized.

{% codesandbox mapbox-covid19-init-3pg2t %}

---

<h3 id="setup_mapbox">2. Setup Mapbox 🗺️</h3>

Get an account from https://account.mapbox.com/ and your access token will be in your account dashboard.

To initialize mapbox you need 4 things:

- Your access token (which you just got)
- DOM container where we will render the map
- A styled map to use:
  - You could use mapbox default `mapbox://styles/mapbox/streets-v11`
  - But for this tutorial we will use [Le-Shine theme](https://www.mapbox.com/gallery/#lè-shine) by talented the Nat Slaughter - he works for Apple as a map designer.
- Initial geolocation
  - You can use this [tool](https://demos.mapbox.com/location-helper/) to find your preferred geolocation
  - For the tutorial, we will use a zoomed-out view of the world to show the impact of COVID-19

This is the condensed code for `App.js` after putting together 👆these steps.

```js
import React, { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import useSWR from "swr"; // React hook to fetch the data
import lookup from "country-code-lookup"; // npm module to get ISO Code for countries

import "./App.scss";

// we need mapbox css for tooltips later in the tutorial
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = "your-access-token";

function App() {
  const mapboxElRef = useRef(null); // DOM element to render map

  // Initialize our map
  useEffect(() => {
    // You can store the map instance with useRef too
    const map = new mapboxgl.Map({
      container: mapboxElRef.current,
      style: "mapbox://styles/notalemesa/ck8dqwdum09ju1ioj65e3ql3k",
      center: [16, 27], // initial geo location
      zoom: 2 // initial zoom
    });

    // Add navigation controls to the top right of the canvas
    map.addControl(new mapboxgl.NavigationControl());
  }, []);

  return (
    <div className="App">
      <div className="mapContainer">
        {/* Assigned Mapbox container */}
        <div className="mapBox" ref={mapboxElRef} />
      </div>
    </div>
  );
}

export default App;
```

- Next, let's add some css to `App.scss`, this will include the css for the tooltip portion of the tutorial

```css
/* This usually goes in the global but let's keep it here
   for the sake of this tutorial */
body {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

/*  Make our map take the full viewport - 100% */
#root,
.App,
.mapBox {
  width: 100%;
  height: 100%;
}

/* Tooltip code */
.mapboxgl-popup {
  font-family: "Baloo Thambi 2", cursive;
  font-size: 10px;
  padding: 0;
  margin: 0;
  color: #424242;
}

.mapboxgl-popup-content {
  padding: 1rem;
  margin: 0;

  > * {
    margin: 0 0 0.5rem;
    padding: 0;
  }

  p {
    border-bottom: 1px solid rgba(black, 0.2);

    b {
      font-size: 1.6rem;
      color: #212121;
      padding: 0 5px;
    }
  }

  img {
    width: 4rem;
    height: 4rem;
  }
}
```

📍`Checkpoint`: At this point, you should have something like this in your screen:

<img src="https://dev-to-uploads.s3.amazonaws.com/i/jh91d51a37k9mn70j9q5.png"/>

---

<h3 id="add_data">3. Add COVID-19 data 👨‍💻</h3>

We're going to be using this API:

[Novelcovid Github Link](https://github.com/novelcovid/api)

[API Docs](https://docs.corona.lmao-xd.wtf/version-2)

We will use the general path https://corona.lmao.ninja/v2/jhucsse which returns a list of countries or provinces with COVID-19 stats.

The response looks like this

```json
[{
  "country": "Canada",
  "province": "Ontario",
  "updatedAt": "2020-03-29 23:13:52",
  "stats": { "confirmed": 1355, "deaths": 21, "recovered": 0 },
  "coordinates": { "latitude": "51.2538", "longitude": "-85.3232" }
},...]
```

We will use [swr](https://swr.now.sh/) by the talented [Zeit](https://zeit.co/home) team to fetch the data and convert it to a mapbox geojson style data which should look like this:

```js
data: {
  type: "FeatureCollection",
  features: [{
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: ["-85.3232", "51.2538"]
        },
        // you can add anything you want to the properties object
        properties: {
          country: 'Canada',
          province: 'Ontario',
          cases: 1355,
          deaths: 21
        }
      }
  }, ...]
}
```

Mapbox works by providing a source (your `data` object) and a layer (we will use circle style for this tutorial)

🗒️`NOTE`: you need to reference the source id on the layer.

By putting together these concepts your code should look like this by now:

```js
function App() {
  const fetcher = url =>
    fetch(url)
      .then(r => r.json())
      .then(data =>
        data.map(p => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [p.coordinates.longitude, p.coordinates.latitude]
          },
          properties: {
            country: p.country,
            province: p.province,
            cases: p.stats.confirmed,
            deaths: p.stats.deaths
          }
        }))
      );

  const { data } = useSWR("https://corona.lmao.ninja/v2/jhucsse", fetcher);

  useEffect(() => {
    if (data) {
      const map = new mapboxgl.Map({
        /* ... previous code */
      });

      // Call this method when the map is loaded
      map.once("load", function() {
        // Add our SOURCE
        map.addSource("points", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: data
          }
        });

        // Add our layer
        map.addLayer({
          id: "circles",
          source: "points", // this should be the id of the source
          type: "circle",
          // paint properties
          paint: {
            "circle-opacity": 0.75,
            "circle-stroke-width": 1,
            "circle-radius": 4,
            "circle-color": "#FFEB3B"
          }
        });
      });
    }
  }, [data]);
}
```

📍`Checkpoint`: At this point, you should have something like this in your screen:

<img src="https://dev-to-uploads.s3.amazonaws.com/i/ypae5irlwg4rfkgfpp0f.png"/>

---

<h3 id="scale_data">4. Scale and colorize the points 🔴</h3>

🌋Now we have a problem: Every dot is equal and COVID-19 impact in the world is certainly not equal - so we will increase the radius of each circle depending on the number of cases.

For this, we will use something called data-driven-styling, here is a good [tutorial](https://blog.mapbox.com/introducing-data-driven-styling-in-mapbox-gl-js-f273121143c3)

In short, this is a way to alter the `paint` properties of a layer.

It looks like this for circle-radius:

```js
   "circle-radius": [
     "interpolate",
     ["linear"],
     ["get", "cases"],
     1, 4,
     50000, 25,
     100000, 50
   ],
```

This 👆probably looks like some dark magic but is not, what this piece of code is doing is:

1. We `interpolate` the data which is just a fancy word for mapping one range to the other one
2. We will do it linearly
3. We will use the `cases` property that we defined before and then we map in a one range to the other one

For example:

- `1` active case = radius `4`
- `50000` active cases = radius `25`
- `100000` active cases = radius `50`

Therefore for example, if you have `75000` cases mapbox will create a radius of `37.5` as a midpoint between 25 and 50

🗒️`NOTE`: Mapbox will properly scale the radius as you zoom in.

🗒️`NOTE`: You might need to change this range as the virus increases in numbers since sadly 100k will be the norm and not the upper limit.

For our tutorial we will use a specific scale system:

```diff
paint: {
-   "circle-radius": 4,
+   "circle-radius": [
+     "interpolate",
+     ["linear"],
+     ["get", "cases"],
+     1, 4,
+     1000, 8,
+     4000, 10,
+     8000, 14,
+     12000, 18,
+     100000, 50
+   ],
}
```

📍`Checkpoint`: At this point, you should have something like this in your screen:

<img src="https://dev-to-uploads.s3.amazonaws.com/i/shs3qclxbghhgdwmc5ni.png"/>

Now we will do the same for the circle-color property

I'm going to use a color palette from colorbrewer2.org which has palettes that are dedicated for maps - this is the specific one we will use 👉 [link 🔗](https://colorbrewer2.org/#type=sequential&scheme=YlOrRd&n=7)

```diff
paint: {
-   "circle-color": "#FFEB3B",
+   "circle-color": [
+     "interpolate",
+     ["linear"],
+     ["get", "cases"],
+     1, '#ffffb2',
+     5000, '#fed976',
+     10000, '#feb24c',
+     25000, '#fd8d3c',
+     50000, '#fc4e2a',
+     75000, '#e31a1c',
+     100000, '#b10026'
+   ],
}
```

I will go ahead and do the same for `circle-stroke-width` because we should scale the border width as the amount of cases increases too.

```diff
paint: {
-   "circle-stroke-width": 1,
+   "circle-stroke-width": [
+     "interpolate",
+     ["linear"],
+     ["get", "cases"],
+     1, 1,
+     100000, 1.75,
+   ],
}
```

📍`Checkpoint`: At this point, you should have something like this in your screen:

<img src="https://dev-to-uploads.s3.amazonaws.com/i/pieex4fconynmr42ab06.png"/>

---

<h3 id="tooltips">5. Add tooltips on hover 📍</h3>

🌋Now we have another problem that the map doesn't tell much beyond the perceived perspective of the damage of the virus on each country so we will add some extra data on hover so people can check specific data for each country

We will add a mouse enter and mouse leave listener to the `circles` layer and we will do some stuff in there.

- We will toggle the cursor style from pointer to default
- We will create an HTML element to insert into the tooltip, this is the data we will use:
  - Country
  - Province (if exists)
  - Cases
  - Deaths
  - Mortality Rate (deaths / cases)
  - Flag (for this we will use `country-lookup-code` in combination with [Country flags API](https://www.countryflags.io))

```js
// After your mapbox layer code inside the 'load' event

// Create a mapbox popup
const popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false
});

// Mouse enter event
map.on("mouseenter", "circles", function(e) {
  // Change the pointer type on mouseenter
  map.getCanvas().style.cursor = "pointer";

  const { cases, deaths, country, province } = e.features[0].properties;
  const coordinates = e.features[0].geometry.coordinates.slice();

  // Get all data for the tooltip
  const countryISO =
    lookup.byCountry(country)?.iso2 || lookup.byFips(country)?.iso2;
  const provinceHTML =
    province !== "null" ? `<p>Province: <b>${province}</b></p>` : "";
  const mortalityRate = ((deaths / cases) * 100).toFixed(2);
  const countryFlagHTML = Boolean(countryISO)
    ? `<img src="https://www.countryflags.io/${countryISO}/flat/64.png"></img>`
    : "";

  const HTML = `<p>Country: <b>${country}</b></p>
              ${provinceHTML}
              <p>Cases: <b>${cases}</b></p>
              <p>Deaths: <b>${deaths}</b></p>
              <p>Mortality Rate: <b>${mortalityRate}%</b></p>
              ${countryFlagHTML}`;

  // Keep the tooltip properly positioned when
  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  }

  popup
    .setLngLat(coordinates)
    .setHTML(HTML)
    .addTo(map);
});

// Mouse leave event
map.on("mouseleave", "circles", function() {
  map.getCanvas().style.cursor = "";
  popup.remove();
});
```

📍`Checkpoint`: At this point, you should have something like this in your screen:

<img src="https://dev-to-uploads.s3.amazonaws.com/i/5gbm67pftxe51e3g7hw0.png"/>

---

<h3 id="complete_code">Complete Code</h3>

Find the completed code here - CodeSandbox: https://codesandbox.io/s/mapbox-covid19-8sni6 - feel free to insert your own access token since that one might not work after a while

{% codesandbox mapbox-covid19-8sni6 %}

<h2 id="challenges">Challenges</h2>

Some ideas to take this further are:

- Filtering by country
- Filter by deaths instead of cases
- Add a sidebar with some general information, maybe use another API
- Make the breakpoints for colors dynamic to the data
- Save data to local storage so you don't hit the API that often - make the local storage expire every day for example

<h2 id="resources">Resources / References</h2>

[Leigh Halliday 📺](https://www.youtube.com/channel/UCWPY8W-FAZ2HdDiJp2RC_sQ) - Youtube Channel that has a lot of high-quality videos some about Mapbox. He also deserves many more followers :)

| Color Palettes

[Color Palette Sequence for maps 🔗](https://colorbrewer2.org/?type=sequential&scheme=YlGnBu&n=7#type=sequential&scheme=YlOrRd&n=7)
[Great Color Palette 🔗](https://www.colorbox.io/)
[Carto 🔗](https://carto.com/carto-colors/)

| Mapbox Links

[Gallery of Mapbox themes 🔗](https://www.mapbox.com/gallery)
[Location Helper 🔗](https://demos.mapbox.com/location-helper/)
[Data driven styling tutorial 🔗](https://docs.mapbox.com/mapbox-gl-js/example/data-driven-circle-colors/)
[Popup on hover tutorial 🔗](https://docs.mapbox.com/mapbox-gl-js/example/popup-on-hover/)

| COVID-19 Links

<h2 id="covid">COVID-19 awereness</h2>

Stay safe 😷 and stay home 🏘️, this a good time to learn new stuff and put Netflix on the side... for a bit, Netflix is awesome.

<h2 id="credits">Credits</h2>

Two of my talented teammates at [Jam3](https://www.jam3.com/) with whom I did a project using Mapbox and I learned a couple of things along the way

- Bonnie Pham - [bonnichiwa](https://github.com/bonnichiwa)
- Yuri Murenko - [ymurenko](https://github.com/ymurenko)
