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
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "locations",
        filter: ["has", "point_count"],
        paint: {
          // Use step expressions (https://docs.mapbox.com/style-spec/reference/expressions/#step)
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#E2231A",
            1,
            "#E2231A",
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            16,
            2,
            20,
            3,
            24,
            4,
            28,
            5,
            32,
          ],
        },
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "locations",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 20,
        },
        paint: {
          "text-color": "#fff"
        }
      });

      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "locations",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 14,
          "circle-color": ["get", "colorCode"],
        },
      });

      // inspect a cluster on click
      map.on("click", "clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        });
        const clusterId = features[0].properties.cluster_id;
        map
          .getSource("locations")
          .getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;

            map.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom,
            });
          });
      });

      // Add popup on click
      map.on("click", "unclustered-point", (e) => {
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

      map.on("mouseenter", "clusters", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("mouseenter", "unclustered-point", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "unclustered-point", () => {
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
