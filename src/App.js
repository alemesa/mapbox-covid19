import React, { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import useSWR from "swr";
import lookup from "country-code-lookup";
import "./App.scss";
// Need mapbox css for tooltips later in the tutorial
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoidHJib3QiLCJhIjoiY2s3NmFscm1xMTV0MDNmcXFyOWp1dGhieSJ9.tR2IMHDqBPOf_AeGjHOKFA";

function App() {
  const mapboxElRef = useRef(null); // DOM element to render map

  const fetcher = (url) =>
    fetch(url)
      .then((r) => r.json())
      .then((data) =>
        data.map((point, index) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [
              point.coordinates.longitude,
              point.coordinates.latitude
            ]
          },
          properties: {
            id: index,
            country: point.country,
            province: point.province,
            cases: point.stats.confirmed,
            deaths: point.stats.deaths
          }
        }))
      );

  const { data } = useSWR("https://disease.sh/v3/covid-19/jhucsse", fetcher);

  // Initialize our map
  useEffect(() => {
    if (data) {
      const average =
        data.reduce((total, next) => total + next.properties.cases, 0) /
        data.length;
      const min = Math.min(...data.map((item) => item.properties.cases));
      const max = Math.max(...data.map((item) => item.properties.cases));

      const map = new mapboxgl.Map({
        container: mapboxElRef.current,
        style: "mapbox://styles/notalemesa/ck8dqwdum09ju1ioj65e3ql3k",
        center: [-98, 37], // North America - intial geo location
        zoom: 3 // initial zoom
      });

      // Add navigation controls to the top right of the canvas
      map.addControl(new mapboxgl.NavigationControl());

      // Add navigation to center the map on your geo location
      map.addControl(
        new mapboxgl.GeolocateControl({
          fitBoundsOptions: { maxZoom: 6 }
        })
      );

      map.once("load", function () {
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
              max,
              1.75
            ],
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["get", "cases"],
              1,
              min,
              1000,
              8,
              average / 4,
              10,
              average / 2,
              14,
              average,
              18,
              max,
              50
            ],
            "circle-color": [
              "interpolate",
              ["linear"],
              ["get", "cases"],
              min,
              "#ffffb2",
              max / 32,
              "#fed976",
              max / 16,
              "#feb24c",
              max / 8,
              "#fd8d3c",
              max / 4,
              "#fc4e2a",
              max / 2,
              "#e31a1c",
              max,
              "#b10026"
            ]
          }
        });

        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false
        });

        let lastId;

        map.on("mousemove", "circles", (e) => {
          const id = e.features[0].properties.id;

          if (id !== lastId) {
            lastId = id;
            const {
              cases,
              deaths,
              country,
              province
            } = e.features[0].properties;

            // Change the pointer type on mouseenter
            map.getCanvas().style.cursor = "pointer";

            const coordinates = e.features[0].geometry.coordinates.slice();

            const countryISO =
              lookup.byCountry(country)?.iso2 ||
              lookup.byInternet(country)?.iso2;
            const countryFlag = `https://raw.githubusercontent.com/stefangabos/world_countries/master/data/flags/64x64/${countryISO.toLowerCase()}.png`;
            const provinceHTML =
              province !== "null" ? `<p>Province: <b>${province}</b></p>` : "";
            const mortalityRate = ((deaths / cases) * 100).toFixed(2);
            const countryFlagHTML = Boolean(countryISO)
              ? `<img src="${countryFlag}"></img>`
              : "";

            const HTML = `<p>Country: <b>${country}</b></p>
                ${provinceHTML}
                <p>Cases: <b>${cases}</b></p>
                <p>Deaths: <b>${deaths}</b></p>
                <p>Mortality Rate: <b>${mortalityRate}%</b></p>
                ${countryFlagHTML}`;

            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            popup.setLngLat(coordinates).setHTML(HTML).addTo(map);
          }
        });

        map.on("mouseleave", "circles", function () {
          lastId = undefined;
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

