import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
// import data from "./locations.json";

import chargerIcon from "../static/charger.svg";
import locationIcon from "../static/location_on.svg";

const images = {
  Hyperscale: "https://i.ibb.co/Rpq1qxn/hyperscale.jpg",
  "Quantum Computing": "https://i.ibb.co/XC0Ds2D/quantum-campus.jpg",
  AI: "https://i.ibb.co/bFWgBtW/ai.jpg",
  Colocation: "https://i.ibb.co/pLRKg1M/colocation.jpg",
  Enterprise: "https://i.ibb.co/pLRKg1M/colocation.jpg",
};

const classnames = {
  Hyperscale: "hyperscale",
  "Quantum Computing": "quantum",
  AI: "ai",
  Colocation: "colocation",
  Enterprise: "enterprise",
};

export class OSMap extends HTMLElement {
  static defaultStylesAdded = false;

  constructor() {
    super();
    this.defaultStyles = `
      <style>
        os-map {
          #map {
            width: 100%;
            height: 1000px;
          }

          .dropdown {
            position: relative;
            width: 254px;
            margin-bottom: 20px;
            font-family:
              DIN Offc Pro Medium,
              Arial,
              sans-serif;
          }

          .dropdown-toggle {
            width: 176px;
            padding: 10px 0;
            background: white;
            border-bottom: 2px solid #212121;
            border-top: none;
            border-right: none;
            border-left: none;
            padding-right: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            font-size: 14px;
          }

          .dropdown-menu {
            position: absolute;
            top: 100%;
            left: 0;
            width: 200px;
            background: white;
            border: 1px solid #212121;
            display: none;
            padding: 10px;
            z-index: 1;
          }

          .dropdown-menu.show {
            display: block;
          }

          .arrow.rotate {
            transform: rotate(180deg);
            transition: transform 0.2s ease;
          }

          .dropdown-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 0;
            cursor: pointer;
          }

          .badge {
            padding: 5px 12px;
            border-radius: 20px;
            color: white;
            font-size: 14px;
            font-weight: 500;
            text-transform: uppercase;
          }

          .enterprise {
            background-color: #212121;
          }

          .quantum {
            background-color: #1476e8;
          }

          .ai {
            background-color: #28a745;
          }

          .colocation {
            background-color: #4e2751;
          }

          .hyperscale {
            color: #212121;
            background-color: #ffc107;
          }

          input[type="checkbox"] {
            width: 16px;
            height: 16px;
            margin: 0;
          }

          .arrow {
            font-size: 10px;
          }

          .mapboxgl-popup-content {
            width: 350px;
            padding: 0;
            color: #212121;

            .mapboxgl-popup-close-button {
              display: none;
            }

            .popup-content-description {
              padding: 16px;
              font-size: 14px;
              line-height: 1.5;

              h3 {
                font-size: 24px;
                line-height: 1.5;
                font-weight: 500;
                margin-top: 0;
                margin-top: 16px;
                margin-bottom: 24px;
              }
            }

            .popup-content-footer {
              display: flex;
              align-items: center;
              font-size: 18px;
              font-weight: 400;
              gap: 20px;

              img {
                width: 24px;
                height: 24px;
                margin-right: 6px;
              }
            }

            .popup-content-footer-item {
              display: flex;
              align-items: center;
            }

            img {
              width: 350px;
              height: 120px;
            }
          }
        }
      </style>
    `;
  }

  connectedCallback() {
    // Add default styles if they haven't been added yet
    if (!OSMap.defaultStylesAdded) {
      document.head.insertAdjacentHTML("afterbegin", this.defaultStyles);

      OSMap.defaultStylesAdded = true;
    }
    const id = this.getAttribute("id") || "map";
    const endpoint = this.getAttribute("data-os-endpoint");
    const key = this.getAttribute("data-os-key");
    const mapLatitude = this.getAttribute("data-os-map-lat");
    const mapLongitude = this.getAttribute("data-os-map-lng");
    const mapZoom = this.getAttribute("data-os-map-zoom");
    const mapStyle = this.getAttribute("data-os-map-style");

    this.innerHTML = `
    <div id ="filter-type" class="dropdown">
      <button class="dropdown-toggle">
        PROJECT TYPE
        <span class="arrow">▼</span>
      </button>
      
      <div class="dropdown-menu">
        <label class="dropdown-item">
          <input type="checkbox" value="Enterprise" checked>
          <span class="badge enterprise">ENTERPRISE</span>
        </label>
        
        <label class="dropdown-item">
          <input type="checkbox" value="Quantum Computing" checked>
          <span class="badge quantum">QUANTUM CAMPUS</span>
        </label>
        
        <label class="dropdown-item">
          <input type="checkbox" value="AI" checked>
          <span class="badge ai">AI</span>
        </label>
        
        <label class="dropdown-item">
          <input type="checkbox" value="Colocation" checked>
          <span class="badge colocation">COLOCATION</span>
        </label>
        
        <label class="dropdown-item">
          <input type="checkbox" value="Hyperscale" checked>
          <span class="badge hyperscale">HYPERSCALE</span>
        </label>
      </div>
    </div>
`;

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
      fetch(endpoint)
        .then((response) => response.json())
        .then((data) => {
          map.addSource("locations", {
            type: "geojson",
            data: data,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
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
              "text-color": "#fff",
            },
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
          <img src="${images[properties.type]}" />
          <div class="popup-content-description">
            <span class="badge ${classnames[properties.type]}">${properties.type}</span>
            <h3>${properties.name}</h3>
            <div class="popup-content-footer">
              <div class="popup-content-footer-item">
                <img src="${chargerIcon}" /><span>${properties.size}</span>
              </div>
              <div class="popup-content-footer-item">
                <img src="${locationIcon}" /><span>${properties.city}, ${properties.state}</span>
              </div>
            </div>
          </div>
        `;

            new mapboxgl.Popup()
              .setLngLat(coordinates)
              .setHTML(popupContent)
              .addTo(map);
          });

          /* Filter by type */
          const container = document.getElementById("filter-type");
          const checkboxes = container.querySelectorAll("input[type=checkbox]");
          const dropdownToggle = container.querySelector(".dropdown-toggle");
          const dropdownMenu = container.querySelector(".dropdown-menu");
          const arrow = dropdownToggle.querySelector(".arrow");

          // Toggle dropdown when clicking the button
          dropdownToggle.addEventListener("click", function (e) {
            dropdownMenu.classList.toggle("show");
            arrow.classList.toggle("rotate");
          });

          // Close dropdown when clicking outside
          document.addEventListener("click", function (e) {
            if (
              !dropdownToggle.contains(e.target) &&
              !dropdownMenu.contains(e.target)
            ) {
              dropdownMenu.classList.remove("show");
              arrow.classList.remove("rotate");
            }
          });

          // Prevent dropdown from closing when clicking inside the menu
          dropdownMenu.addEventListener("click", function (e) {
            e.stopPropagation();
          });

          // Create an array to store the selected types
          let originalData = data; // Store the original data
          let selectedTypes = [
            "Enterprise",
            "Quantum Computing",
            "AI",
            "Colocation",
            "Hyperscale",
          ];

          checkboxes.forEach((input) => {
            input.addEventListener("change", (event) => {
              // Update selected types based on checkbox state
              if (event.target.checked) {
                selectedTypes.push(event.target.value);
              } else {
                selectedTypes = selectedTypes.filter(
                  (type) => type !== event.target.value,
                );
              }

              // Filter the data based on selected types
              const filteredData = {
                type: originalData.type,
                features: originalData.features.filter((feature) =>
                  selectedTypes.includes(feature.properties.type),
                ),
              };

              // Update the map source with filtered data
              map.getSource("locations").setData(filteredData);
            });
          });

          /* End filter by type */

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
        })
        .catch((error) => {
          console.error("Error loading map data:", error);
        });
    });
  }
}

customElements.define("os-map", OSMap);
