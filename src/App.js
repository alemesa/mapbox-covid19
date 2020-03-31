import React, { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import useSWR from "swr";
import lookup from "country-code-lookup";
import "./App.scss";
// Need mapbox css for tooltips later in the tutorial
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

function App() {
  const mapboxElRef = useRef(null); // DOM element to render map

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

  // Initialize our map
  useEffect(() => {
    if (data) {
      const map = new mapboxgl.Map({
        container: mapboxElRef.current,
        style: "mapbox://styles/notalemesa/ck8dqwdum09ju1ioj65e3ql3k",
        center: [16, 27],
        zoom: 2
      });

      // Add navigation controls to the top right of the canvas
      map.addControl(new mapboxgl.NavigationControl());

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
          source: "points", // this should be the id of source
          type: "circle",
          paint: {
            "circle-opacity": 0.75,
            "circle-stroke-width": [
              "interpolate",
              ["linear"],
              ["get", "cases"],
              1,
              1,
              100000,
              1.75
            ],
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["get", "cases"],
              1,
              4,
              1000,
              8,
              4000,
              10,
              8000,
              14,
              12000,
              18,
              100000,
              50
            ],
            "circle-color": [
              "interpolate",
              ["linear"],
              ["get", "cases"],
              1,
              "#ffffb2",
              5000,
              "#fed976",
              10000,
              "#feb24c",
              25000,
              "#fd8d3c",
              50000,
              "#fc4e2a",
              75000,
              "#e31a1c",
              100000,
              "#b10026"
            ]
          }
        });

        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false
        });

        map.on("mouseenter", "circles", function(e) {
          // Change the pointer type on mouseenter
          map.getCanvas().style.cursor = "pointer";

          const { cases, deaths, country, province } = e.features[0].properties;
          const coordinates = e.features[0].geometry.coordinates.slice();

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

        map.on("mouseleave", "circles", function() {
          map.getCanvas().style.cursor = "";
          popup.remove();
        });
      });
    }
  }, [data]);

  return (
    <div className="App">
      <div className="mapContainer">
        {/* Mapbox Container */}
        <div className="mapBox" ref={mapboxElRef} />
      </div>
    </div>
  );
}

export default App;
