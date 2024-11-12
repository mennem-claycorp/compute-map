import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import mapStyles from "./styles/map.css";
import typeDropdown from "./dropdowns/filter-type.html";
import sizeDropdown from "./dropdowns/filter-size.html";
import stateDropdown from "./dropdowns/filter-state.html";

import chargerIcon from "../static/charger.svg";
import locationIcon from "../static/location_on.svg";
import arrowDownIcon from "../static/arrow_drop_down.svg";
import checkIcon from "../static/check_small.svg";

const filterDropdowns = [typeDropdown, sizeDropdown, stateDropdown];

const classnames = {
  Hyperscale: "hyperscale",
  "Quantum Campus": "quantum",
  AI: "ai",
  Colocation: "colocation",
  Enterprise: "enterprise",
};

export class OSMap extends HTMLElement {
  static defaultStylesAdded = false;

  constructor() {
    super();
    this.defaultStyles = `<style>${mapStyles}</style>`;
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
    const mapLock = this.getAttribute("data-os-map-lock") === "true";

    const filtersContainer = document.createElement("div");
    const dropdownsContainer = document.createElement("div");
    const filtersTitle = document.createElement("span");
    filtersTitle.textContent = "Filter by:";
    filtersContainer.appendChild(filtersTitle);
    filtersContainer.appendChild(dropdownsContainer);
    dropdownsContainer.classList.add("filters-dropdowns");
    filtersTitle.classList.add("filters-title");
    filtersContainer.classList.add("filters");
    this.appendChild(filtersContainer);

    filterDropdowns.forEach((template) => {
      dropdownsContainer.innerHTML += template;
    });

    this.querySelectorAll(".check-icon").forEach((imgTag) => {
      imgTag.src = checkIcon;
    });

    this.querySelectorAll(".arrow").forEach((imgTag) => {
      imgTag.src = arrowDownIcon;
    });

    const mapContainer = document.createElement("div");
    mapContainer.classList.add("map-container");

    const mapWrapper = document.createElement("div");
    mapWrapper.id = id;
    mapContainer.appendChild(mapWrapper);
    this.appendChild(mapContainer);

    mapboxgl.accessToken = key;
    const map = new mapboxgl.Map({
      container: id,
      center: [parseFloat(mapLongitude), parseFloat(mapLatitude)],
      zoom: parseFloat(mapZoom),
      style: mapStyle,
      scrollZoom: !mapLock,
    });

    map.on("load", () => {
      fetch(endpoint)
        .then((response) => response.json())
        .then((data) => {
          map.addImage("location-icon", arrowDownIcon);
          map.addControl(
            new mapboxgl.NavigationControl({ showCompass: false }),
            "bottom-right",
          );
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

          // Load all unique icons from the data
          const uniqueIcons = [
            ...new Set(data.features.map((f) => f.properties.iconUrl)),
          ];
          uniqueIcons.forEach((iconUrl) => {
            map.loadImage(iconUrl, (error, image) => {
              if (error) throw error;
              map.addImage(iconUrl, image);
            });
          });

          map.addLayer({
            id: "unclustered-point",
            type: "symbol",
            source: "locations",
            filter: ["!", ["has", "point_count"]],
            layout: {
              "icon-image": ["get", "iconUrl"],
              "icon-size": 0.8,
              "icon-allow-overlap": true,
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

          // Preload popup images
          const preloadImages = (images) => {
            images.forEach((imageUrl) => {
              const img = new Image();
              img.src = imageUrl;
            });
          };

          const uniqueImages = [
            ...new Set(data.features.map((f) => f.properties.image)),
          ];
          preloadImages(uniqueImages);

          // Add popup on click
          map.on("click", "unclustered-point", (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const properties = e.features[0].properties;

            const popupContent = `
            <img src="${properties.image}" />
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

            new mapboxgl.Popup({ offset: 20 })
              .setLngLat(coordinates)
              .setHTML(popupContent)
              .addTo(map);
          });

          /* Filtering */
          const setupDropdown = (containerId) => {
            const container = document.getElementById(containerId);
            const dropdownToggle = container.querySelector(".dropdown-toggle");
            const dropdownMenu = container.querySelector(".dropdown-menu");
            const arrow = dropdownToggle.querySelector(".arrow");

            dropdownToggle.addEventListener("click", () => {
              dropdownMenu.classList.toggle("show");
              arrow.classList.toggle("rotate");

              // Check if menu is visible and adjust position if needed
              if (dropdownMenu.classList.contains("show")) {
                const menuRect = dropdownMenu.getBoundingClientRect();
                const viewportWidth = window.innerWidth;

                if (menuRect.right > viewportWidth) {
                  const overflow = menuRect.right - viewportWidth;
                  dropdownMenu.style.left = `-${overflow + 5}px`;
                }
              } else {
                // Reset position when hiding
                dropdownMenu.style.left = "";
              }
            });

            // Close dropdown when clicking outside
            document.addEventListener("click", (e) => {
              if (
                !dropdownToggle.contains(e.target) &&
                !dropdownMenu.contains(e.target)
              ) {
                dropdownMenu.classList.remove("show");
                arrow.classList.remove("rotate");
              }
            });

            dropdownMenu.addEventListener("click", (e) => e.stopPropagation());

            return container.querySelectorAll("input[type=checkbox]");
          };

          // Setup dropdowns
          const typeCheckboxes = setupDropdown("filter-type");
          const sizeCheckboxes = setupDropdown("filter-size");
          const stateCheckboxes = setupDropdown("filter-state");

          // Track selected filters
          let originalData = data;
          let selectedTypes = [];
          let selectedSizes = [];
          let selectedStates = [];

          // Apply filters to the data
          const applyFilters = () => {
            const filteredData = {
              type: originalData.type,
              features: originalData.features.filter((feature) => {
                const typeMatch =
                  selectedTypes.length === 0 ||
                  selectedTypes.includes(feature.properties.type);
                const sizeMatch =
                  selectedSizes.length === 0 ||
                  selectedSizes.includes(feature.properties.size);
                const stateMatch =
                  selectedStates.length === 0 ||
                  selectedStates.includes(feature.properties.state);
                return typeMatch && sizeMatch && stateMatch;
              }),
            };

            map
              .getSource("locations")
              .setData(
                selectedTypes.length === 0 &&
                  selectedSizes.length === 0 &&
                  selectedStates.length === 0
                  ? originalData
                  : filteredData,
              );
          };

          // Add listeners to type checkboxes
          typeCheckboxes.forEach((input) => {
            input.addEventListener("change", (event) => {
              if (event.target.checked) {
                selectedTypes.push(event.target.value);
              } else {
                selectedTypes = selectedTypes.filter(
                  (type) => type !== event.target.value,
                );
              }
              applyFilters();
            });
          });

          // Add listeners to size checkboxes
          sizeCheckboxes.forEach((input) => {
            input.addEventListener("change", (event) => {
              if (event.target.checked) {
                selectedSizes.push(event.target.value);
              } else {
                selectedSizes = selectedSizes.filter(
                  (size) => size !== event.target.value,
                );
              }
              applyFilters();
            });
          });

          // Add listeners to state checkboxes
          stateCheckboxes.forEach((input) => {
            input.addEventListener("change", (event) => {
              if (event.target.checked) {
                selectedStates.push(event.target.value);
              } else {
                selectedStates = selectedStates.filter(
                  (size) => size !== event.target.value,
                );
              }
              applyFilters();
            });
          });

          /* End of filtering */

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
