import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import gjv from "geojson-validation";

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
  Hyperscale: "os-map-hyperscale",
  "Quantum Campus": "os-map-quantum",
  AI: "os-map-ai",
  Colocation: "os-map-colocation",
  Enterprise: "os-map-enterprise",
};

export class OSMap extends HTMLElement {
  static defaultStylesAdded = false;
  map = null;
  originalData = null;
  selectedTypes = [];
  selectedSizes = [];
  selectedStates = [];

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

    const id = this.getAttribute("data-os-map-id") || "map";
    const endpoint = this.getAttribute("data-os-map-endpoint");
    const key = this.getAttribute("data-os-map-key");
    const mapLatitude = this.getAttribute("data-os-map-lat");
    const mapLongitude = this.getAttribute("data-os-map-lng");
    const mapZoom = this.getAttribute("data-os-map-zoom");
    const mapStyle = this.getAttribute("data-os-map-style");
    const mapLock = this.getAttribute("data-os-map-lock") === "true";

    // Build filter dropdowns
    const filtersContainer = document.createElement("div");
    const dropdownsContainer = document.createElement("div");
    const filtersTitle = document.createElement("span");
    filtersTitle.textContent = "Filter by:";
    filtersContainer.appendChild(filtersTitle);
    filtersContainer.appendChild(dropdownsContainer);
    dropdownsContainer.classList.add("os-map-filters-dropdowns");
    filtersTitle.classList.add("os-map-filters-title");
    filtersContainer.classList.add("os-map-filters");
    this.appendChild(filtersContainer);

    filterDropdowns.forEach((template) => {
      dropdownsContainer.innerHTML += template;
    });

    this.querySelectorAll(".os-map-check-icon").forEach((imgTag) => {
      imgTag.src = checkIcon;
    });

    this.querySelectorAll(".os-map-arrow").forEach((imgTag) => {
      imgTag.src = arrowDownIcon;
    });

    // Build map container
    const mapContainer = document.createElement("div");
    mapContainer.classList.add("os-map-container");

    const mapWrapper = document.createElement("div");
    mapWrapper.id = id;
    mapContainer.appendChild(mapWrapper);
    this.appendChild(mapContainer);

    mapboxgl.accessToken = key;
    this.map = new mapboxgl.Map({
      container: id,
      center: [parseFloat(mapLongitude), parseFloat(mapLatitude)],
      zoom: parseFloat(mapZoom),
      style: mapStyle,
      scrollZoom: !mapLock,
    });

    this.map.on("load", () => {
      if (endpoint) {
        fetch(endpoint)
          .then((response) => response.json())
          .then((data) => this.setData(data))
          .catch((error) => {
            console.error("Error loading map data:", error);
          });
      }
    });
  }

  setData(data) {
    const isValidGeoJSON = gjv.valid(data);
    if (!isValidGeoJSON) {
      console.error("Invalid GeoJSON data");
      return;
    }

    const map = this.map;

    // Update originalData for filters
    this.originalData = data;

    // Reset selected filters if not initialized
    this.selectedTypes = this.selectedTypes || [];
    this.selectedSizes = this.selectedSizes || [];
    this.selectedStates = this.selectedStates || [];

    // Preload popup images in background
    const uniquePopupImages = [
      ...new Set(data.features.map((f) => f.properties.image)),
    ];
    const preloadImages = (images) => {
      images.forEach((imageUrl) => {
        const img = new Image();
        img.src = imageUrl;
      });
    };
    preloadImages(uniquePopupImages);

    // Load map icons
    const uniqueIcons = [
      ...new Set(data.features.map((f) => f.properties.iconUrl)),
    ];
    const loadIconPromises = uniqueIcons.map(
      (iconUrl) =>
        new Promise((resolve, reject) => {
          if (!map.hasImage(iconUrl)) {
            map.loadImage(iconUrl, (error, image) => {
              if (error) reject(error);
              map.addImage(iconUrl, image);
              resolve();
            });
          } else {
            resolve();
          }
        }),
    );

    Promise.all(loadIconPromises)
      .then(() => {
        if (map.getSource("locations")) {
          const filteredData = this.getFilteredData();
          map.getSource("locations").setData(filteredData);
          return;
        }

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
          clusterRadius: 40,
        });

        map.addLayer({
          id: "clusters",
          type: "circle",
          source: "locations",
          filter: ["has", "point_count"],
          paint: {
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
          type: "symbol",
          source: "locations",
          filter: ["!", ["has", "point_count"]],
          layout: {
            "icon-image": ["get", "iconUrl"],
            "icon-size": 0.8,
            "icon-allow-overlap": true,
          },
        });

        this.setupEventHandlers();
        this.setupFilters();
      })
      .catch((error) => {
        console.error("Error loading icons:", error);
      });
  }

  getFilteredData() {
    const filteredData = {
      type: this.originalData.type,
      features: this.originalData.features.filter((feature) => {
        const typeMatch =
          this.selectedTypes.length === 0 ||
          this.selectedTypes.includes(feature.properties.type);
        const sizeMatch =
          this.selectedSizes.length === 0 ||
          this.selectedSizes.includes(feature.properties.size);
        const stateMatch =
          this.selectedStates.length === 0 ||
          this.selectedStates.includes(feature.properties.state);
        return typeMatch && sizeMatch && stateMatch;
      }),
    };

    return this.selectedTypes.length === 0 &&
      this.selectedSizes.length === 0 &&
      this.selectedStates.length === 0
      ? this.originalData
      : filteredData;
  }

  setupFilters() {
    const setupDropdown = (containerId) => {
      const container = document.getElementById(containerId);
      const dropdownToggle = container.querySelector(".os-map-dropdown-toggle");
      const dropdownMenu = container.querySelector(".os-map-dropdown-menu");
      const arrow = dropdownToggle.querySelector(".os-map-arrow");

      dropdownToggle.addEventListener("click", () => {
        dropdownMenu.classList.toggle("show");
        arrow.classList.toggle("rotate");

        if (dropdownMenu.classList.contains("show")) {
          const menuRect = dropdownMenu.getBoundingClientRect();
          const viewportWidth = window.innerWidth;

          if (menuRect.right > viewportWidth) {
            const overflow = menuRect.right - viewportWidth;
            dropdownMenu.style.left = `-${overflow + 5}px`;
          }
        } else {
          dropdownMenu.style.left = "";
        }
      });

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

    const typeCheckboxes = setupDropdown("os-map-filter-type");
    const sizeCheckboxes = setupDropdown("os-map-filter-size");
    const stateCheckboxes = setupDropdown("os-map-filter-state");

    typeCheckboxes.forEach((input) => {
      input.addEventListener("change", (event) => {
        if (event.target.checked) {
          this.selectedTypes.push(event.target.value);
        } else {
          this.selectedTypes = this.selectedTypes.filter(
            (type) => type !== event.target.value,
          );
        }
        const filteredData = this.getFilteredData();
        this.map.getSource("locations").setData(filteredData);
      });
    });

    sizeCheckboxes.forEach((input) => {
      input.addEventListener("change", (event) => {
        if (event.target.checked) {
          this.selectedSizes.push(event.target.value);
        } else {
          this.selectedSizes = this.selectedSizes.filter(
            (size) => size !== event.target.value,
          );
        }
        const filteredData = this.getFilteredData();
        this.map.getSource("locations").setData(filteredData);
      });
    });

    stateCheckboxes.forEach((input) => {
      input.addEventListener("change", (event) => {
        if (event.target.checked) {
          this.selectedStates.push(event.target.value);
        } else {
          this.selectedStates = this.selectedStates.filter(
            (state) => state !== event.target.value,
          );
        }
        const filteredData = this.getFilteredData();
        this.map.getSource("locations").setData(filteredData);
      });
    });
  }

  setupEventHandlers() {
    const map = this.map;

    map.on("click", "clusters", (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["clusters"],
      });
      const clusterId = features[0].properties.cluster_id;
      const clusterCenter = features[0].geometry.coordinates;

      map.easeTo({
        center: clusterCenter,
        duration: 500,
      });

      map.setPaintProperty("clusters", "circle-opacity", [
        "case",
        ["==", ["get", "cluster_id"], clusterId],
        0,
        1,
      ]);
      map.setPaintProperty("cluster-count", "text-opacity", [
        "case",
        ["==", ["get", "cluster_id"], clusterId],
        0,
        1,
      ]);

      // Hide expanded cluster and lines on map click
      map.on("click", (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["clusters", "expanded-cluster-points"],
        });

        if (features.length === 0) {
          // Hide expanded cluster and lines
          if (map.getSource("expanded-cluster")) {
            map.getSource("expanded-cluster").setData({
              type: "FeatureCollection",
              features: [],
            });
          }

          if (map.getSource("cluster-lines")) {
            map.getSource("cluster-lines").setData({
              type: "FeatureCollection",
              features: [],
            });
          }

          // Reset cluster opacity
          map.setPaintProperty("clusters", "circle-opacity", 1);
          map.setPaintProperty("cluster-count", "text-opacity", 1);
        }
      });

      map
        .getSource("locations")
        .getClusterLeaves(clusterId, 100, 0, (err, clusterFeatures) => {
          if (err) return;

          const pointCount = clusterFeatures.length;
          const currentZoom = map.getZoom();
          const radius =
            (10 / Math.pow(2, currentZoom)) * Math.log2(pointCount + 1);
          const latitudeAdjustment = Math.cos(
            (clusterCenter[1] * Math.PI) / 180,
          );

          clusterFeatures = clusterFeatures.map((feature, index) => {
            const angle = (index / clusterFeatures.length) * 2 * Math.PI;
            const newLng =
              clusterCenter[0] +
              (radius * Math.cos(angle)) / latitudeAdjustment;
            const newLat = clusterCenter[1] + radius * Math.sin(angle);

            return {
              ...feature,
              geometry: {
                ...feature.geometry,
                coordinates: [newLng, newLat],
              },
            };
          });

          const expandedClusterSource = {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: clusterFeatures,
            },
          };

          const linesData = {
            type: "FeatureCollection",
            features: clusterFeatures.map((feature) => ({
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: [clusterCenter, feature.geometry.coordinates],
              },
            })),
          };

          if (!map.getSource("cluster-lines")) {
            map.addSource("cluster-lines", {
              type: "geojson",
              data: linesData,
            });

            map.addLayer({
              id: "cluster-lines-layer",
              type: "line",
              source: "cluster-lines",
              layout: {
                "line-cap": "round",
                "line-join": "round",
              },
              paint: {
                "line-color": "#666",
                "line-width": 1,
                "line-opacity": 0.8,
                "line-dasharray": [1, 2],
              },
            });
          } else {
            map.getSource("cluster-lines").setData(linesData);
          }

          if (!map.getSource("expanded-cluster")) {
            map.addSource("expanded-cluster", expandedClusterSource);

            map.addLayer({
              id: "expanded-cluster-points",
              type: "symbol",
              source: "expanded-cluster",
              layout: {
                "icon-image": ["get", "iconUrl"],
                "icon-size": 0.8,
                "icon-allow-overlap": true,
              },
            });

            map.on("click", "expanded-cluster-points", (e) => {
              const coordinates = e.features[0].geometry.coordinates.slice();
              const properties = e.features[0].properties;

              new mapboxgl.Popup({ offset: 20 })
                .setLngLat(coordinates)
                .setHTML(this.buildPopupContent(properties))
                .addTo(map);
            });
          } else {
            map
              .getSource("expanded-cluster")
              .setData(expandedClusterSource.data);
          }
        });
    });

    map.on("click", "unclustered-point", (e) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const properties = e.features[0].properties;

      new mapboxgl.Popup({ offset: 20 })
        .setLngLat(coordinates)
        .setHTML(this.buildPopupContent(properties))
        .addTo(map);
    });

    // Clean up expanded clusters when zooming
    map.on("zoom", () => {
      if (map.getSource("expanded-cluster")) {
        map.getSource("expanded-cluster").setData({
          type: "FeatureCollection",
          features: [],
        });
      }

      if (map.getSource("cluster-lines")) {
        map.getSource("cluster-lines").setData({
          type: "FeatureCollection",
          features: [],
        });
      }

      // Reset cluster opacity
      map.setPaintProperty("clusters", "circle-opacity", 1);
      map.setPaintProperty("cluster-count", "text-opacity", 1);
    });

    // Handle cursor style for interactive layers
    const interactiveLayers = [
      "clusters",
      "unclustered-point",
      "expanded-cluster-points",
    ];

    interactiveLayers.forEach((layer) => {
      map.on("mouseenter", layer, () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", layer, () => {
        map.getCanvas().style.cursor = "";
      });
    });
  }

  buildPopupContent(properties) {
    return `
      <img class="os-map-popup-content-image" src="${properties.image}" />
      <div class="os-map-popup-content-description">
        <span class="os-map-badge ${classnames[properties.type]}">${properties.type}</span>
        <h3>${properties.name}</h3>
        <div class="os-map-popup-content-footer">
          <div class="os-map-popup-content-footer-item">
            <img class="os-map-popup-content-icon" src="${chargerIcon}" /><span>${properties.size}</span>
          </div>
          <div class="os-map-popup-content-footer-item">
            <img class="os-map-popup-content-icon" src="${locationIcon}" /><span>${properties.city}, ${properties.state}</span>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("os-map", OSMap);
