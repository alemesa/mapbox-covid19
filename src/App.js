import React, { memo, useRef, useEffect } from "react";
import useSWR from "swr";
import mapboxgl from "mapbox-gl";
import lookup from "country-code-lookup";

import "./App.scss";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const INITIAL_VIEW_STATE = {
  center: [16, 27],
  zoom: 2,
  pitch: 20,
  bearing: 0
};

function App() {
  const mapboxInstanceRef = useRef(null);
  const mapboxElRef = useRef(null);

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
      mapboxInstanceRef.current = new mapboxgl.Map({
        container: mapboxElRef.current,
        style: "mapbox://styles/notalemesa/ck8dqwdum09ju1ioj65e3ql3k",
        ...INITIAL_VIEW_STATE,
        antialias: true
      });

      mapboxInstanceRef.current.addControl(new mapboxgl.NavigationControl());

      mapboxInstanceRef.current.once("load", function() {
        mapboxInstanceRef.current.addSource("points", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: data
          }
        });

        mapboxInstanceRef.current.addLayer({
          id: "circles",
          source: "points",
          type: "circle",
          paint: {
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
            ],
            "circle-opacity": 0.75,
            "circle-stroke-width": [
              "interpolate",
              ["linear"],
              ["get", "cases"],
              1,
              1,
              100000,
              1.75
            ]
          }
        });

        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false
        });

        mapboxInstanceRef.current.on("mouseenter", "circles", function(e) {
          mapboxInstanceRef.current.getCanvas().style.cursor = "pointer";

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

          // Keep the tooltip properly positioned when zooming out
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          popup
            .setLngLat(coordinates)
            .setHTML(HTML)
            .addTo(mapboxInstanceRef.current);
        });

        mapboxInstanceRef.current.on("mouseleave", "circles", function() {
          mapboxInstanceRef.current.getCanvas().style.cursor = "";
          popup.remove();
        });
      });
    }

    return () => {
      if (mapboxInstanceRef.current) mapboxInstanceRef.current.remove();
    };
  }, [data]);

  return (
    <div className="App">
      <div className="mapContainer">
        <div className="mapBox" ref={mapboxElRef} />
      </div>
    </div>
  );
}

App.propTypes = {};

App.defaultProps = {};

export default memo(App);
