import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import data from "./locations.json";

export class OSMap extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const id = this.getAttribute("id") || "map";
    const endpoint = this.getAttribute("data-os-endpoint");
    const key = this.getAttribute("data-os-key");
    const mapLatitude = this.getAttribute("data-os-map-lat");
    const mapLongitude = this.getAttribute("data-os-map-lng");
    const mapZoom = this.getAttribute("data-os-map-zoom");
    const mapStyle = this.getAttribute("data-os-map-style");

    const mapContainer = document.createElement("div");
    mapContainer.id = id;
    this.appendChild(mapContainer);

    mapboxgl.accessToken = key;
    const map = new mapboxgl.Map({
      container: id,
      center: [parseFloat(mapLongitude), parseFloat(mapLatitude)],
      zoom: parseFloat(mapZoom),
      style: mapStyle,
    });

    map.on("load", () => {
      /* Uncomment this block and remove import to load data from an endpoint */
      //  fetch(endpoint)
      //    .then((response) => response.json())
      //    .then((data) => {
      map.addSource("locations", {
        type: "geojson",
        data: data,
      });

      // Add a layer for points
      map.addLayer({
        id: "locations",
        type: "circle",
        source: "locations",
        paint: {
          "circle-radius": 14,
          "circle-color": ["get", "colorCode"],
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Add popup on click
      map.on("click", "locations", (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const properties = e.features[0].properties;

        const popupContent = `
          <h3>${properties.name}</h3>
          <p>Type: ${properties.type}</p>
          <p>${properties.city}, ${properties.state}</p>
        `;

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(popupContent)
          .addTo(map);
      });

      // Change cursor to pointer when hovering over points
      map.on("mouseenter", "locations", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "locations", () => {
        map.getCanvas().style.cursor = "";
      });
      /* Uncomment this block to load data from an endpoint */
      //    })
      //    .catch((error) => {
      //      console.error("Error loading map data:", error);
      //    });

    });
  }
}

customElements.define("os-map", OSMap);
