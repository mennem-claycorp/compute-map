import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import gjv from "geojson-validation";
import * as turf from "@turf/turf";

import mapStyles from "./styles/map.css";
import typeDropdown from "./dropdowns/filter-type.html";
import sizeDropdown from "./dropdowns/filter-size.html";
import stateDropdown from "./dropdowns/filter-state.html";
import chargerIcon from "../static/charger.svg";
import locationIcon from "../static/location_on.svg";
import arrowDownIcon from "../static/arrow_drop_down.svg";
import { stateMapper, availableMapProjections } from "./utils";

const filterDropdowns = [typeDropdown, sizeDropdown, stateDropdown];

export class OSMap extends HTMLElement {
  static defaultStylesAdded = false;
  map = null;
  originalData = null;
  viewportBounds = null;
  mapRefocus = false;
  mapLegend = false;
  mapId = null;
  selectedTypes = [];
  selectedSizes = [];
  selectedStates = [];

  constructor() {
    super();
    this.defaultStyles = `<style>${mapStyles}</style>`;
  }

  connectedCallback() {
    if (mapboxgl.supported()) {
      // Hide fallback content
      Array.from(this.children).forEach((el) => {
        el.classList.add("os-hidden");
      });
    } else {
      return;
    }
    // Add default styles if they haven't been added yet
    if (!OSMap.defaultStylesAdded) {
      document.head.insertAdjacentHTML("afterbegin", this.defaultStyles);
      OSMap.defaultStylesAdded = true;
    }

    const id = this.getAttribute("data-os-map-id") || "map";
    this.mapId = id;
    const endpoint =
      this.getAttribute("data-os-map-endpoint") ||
      this.getAttribute("data-os-endpoint");
    const key =
      this.getAttribute("data-os-map-key") || this.getAttribute("data-os-key");
    const mapStyle = this.getAttribute("data-os-map-style");
    const hasMapLockAttribute = this.hasAttribute("data-os-map-lock");
    const mapLock =
      hasMapLockAttribute && this.getAttribute("data-os-map-lock");
    const mapProjection = this.getAttribute("data-os-map-projection");
    const mapLatitude = parseFloat(this.getAttribute("data-os-map-lat"));
    const mapLongitude = parseFloat(this.getAttribute("data-os-map-lng"));
    const mapZoom = parseFloat(this.getAttribute("data-os-map-zoom"));
    const minZoom = parseFloat(this.getAttribute("data-os-map-zoom-min"));
    const maxZoom = parseFloat(this.getAttribute("data-os-map-zoom-max"));
    const mapBoundWest = parseFloat(
      this.getAttribute("data-os-map-bound-west"),
    );
    const mapBoundSouth = parseFloat(
      this.getAttribute("data-os-map-bound-south"),
    );
    const mapBoundEast = parseFloat(
      this.getAttribute("data-os-map-bound-east"),
    );
    const mapBoundNorth = parseFloat(
      this.getAttribute("data-os-map-bound-north"),
    );
    const mapViewportWest = parseFloat(
      this.getAttribute("data-os-map-viewport-west"),
    );
    const mapViewportSouth = parseFloat(
      this.getAttribute("data-os-map-viewport-south"),
    );
    const mapViewportEast = parseFloat(
      this.getAttribute("data-os-map-viewport-east"),
    );
    const mapViewportNorth = parseFloat(
      this.getAttribute("data-os-map-viewport-north"),
    );
    const hasMapRefocusAttr = this.hasAttribute("data-os-map-refocus");
    const mapRefocusAttrValue =
      hasMapRefocusAttr && this.getAttribute("data-os-map-refocus");
    this.mapRefocus = hasMapRefocusAttr && mapRefocusAttrValue !== "false";
    const hasMapLegendAttr = this.hasAttribute("data-os-map-legend");
    const mapLegendAttrValue =
      hasMapLegendAttr && this.getAttribute("data-os-map-legend");
    this.mapLegend = hasMapLegendAttr && mapLegendAttrValue !== "false";

    const mapCenter =
      mapLongitude && mapLatitude ? [mapLongitude, mapLatitude] : null;
    this.viewportBounds = this.buildBounds(
      mapViewportWest,
      mapViewportSouth,
      mapViewportEast,
      mapViewportNorth,
    );
    const maxBounds = this.buildBounds(
      mapBoundWest,
      mapBoundSouth,
      mapBoundEast,
      mapBoundNorth,
    );

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
      center: mapCenter,
      zoom: mapZoom || 0,
      style: mapStyle,
      doubleClickZoom: false,
      cooperativeGestures: hasMapLockAttribute && mapLock !== "false",
      projection: {
        name: availableMapProjections.includes(mapProjection)
          ? mapProjection
          : "mercator",
      },
      maxBounds: maxBounds,
      minZoom: minZoom || 0,
      maxZoom: maxZoom || 22,
    });

    this.map.on("load", () => {
      if (this.viewportBounds) {
        this.map.fitBounds(this.viewportBounds, {
          padding: { top: 10, bottom: 10, left: 10, right: 10 },
        });
      }
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
    ].filter(Boolean);
    const preloadImages = (images) => {
      images.forEach((imageUrl) => {
        const img = new Image();
        img.src = imageUrl;
      });
    };
    preloadImages(uniquePopupImages);

    // Create markers for each unique color in the data
    const createMarkerSVG = (color) => {
      const svg = `
        <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.0001 20C17.1001 20 18.0418 19.6083 18.8251 18.825C19.6085 18.0417 20.0001 17.1 20.0001 16C20.0001 14.9 19.6085 13.9583 18.8251 13.175C18.0418 12.3917 17.1001 12 16.0001 12C14.9001 12 13.9585 12.3917 13.1751 13.175C12.3918 13.9583 12.0001 14.9 12.0001 16C12.0001 17.1 12.3918 18.0417 13.1751 18.825C13.9585 19.6083 14.9001 20 16.0001 20ZM16.0001 40C10.6335 35.4333 6.62512 31.1917 3.97512 27.275C1.32512 23.3583 0.00012207 19.7333 0.00012207 16.4C0.00012207 11.4 1.60846 7.41667 4.82512 4.45C8.04179 1.48333 11.7668 0 16.0001 0C20.2335 0 23.9585 1.48333 27.1751 4.45C30.3918 7.41667 32.0001 11.4 32.0001 16.4C32.0001 19.7333 30.6751 23.3583 28.0251 27.275C25.3751 31.1917 21.3668 35.4333 16.0001 40Z" fill="${color}"/>
        </svg>
    `;
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    };

    const uniqueColors = [
      ...new Set(data.features.map((f) => f.properties.colorCode)),
    ].filter(Boolean);

    const loadMarkerPromises = uniqueColors.map(
      (color) =>
        new Promise((resolve, reject) => {
          if (!map.hasImage(`marker-${color}`)) {
            const markerImage = new Image();
            markerImage.src = createMarkerSVG(color);
            markerImage.onload = () => {
              map.addImage(`marker-${color}`, markerImage);
              resolve();
            };
            markerImage.onerror = reject;
          } else {
            resolve();
          }
        }),
    );

    Promise.all(loadMarkerPromises)
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
            "text-allow-overlap": true,
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
            "icon-image": ["concat", "marker-", ["get", "colorCode"]],
            "icon-size": 0.8,
            "icon-allow-overlap": true,
          },
        });

        this.setupEventHandlers();
        this.setupFilters();
        if (this.mapLegend) {
          this.setupLegend();
        }
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
    const setupDropdown = (containerId, type) => {
      const container = document.getElementById(containerId);
      const dropdownToggle = container.querySelector(".os-map-dropdown-toggle");
      const dropdownMenu = container.querySelector(".os-map-dropdown-menu");
      const menuList = container.querySelector(".os-map-dropdown-menu-list");
      const closeButton = container.querySelector(
        ".os-map-dropdown-close-button",
      );
      const resetButton = container.querySelector(
        ".os-map-filter-reset-button",
      );
      const countElement = container.querySelector(".os-map-filter-count");
      const arrow = dropdownToggle.querySelector(".os-map-arrow");

      dropdownToggle.addEventListener("click", () => {
        dropdownMenu.classList.toggle("show");
        arrow.classList.toggle("rotate");

        if (dropdownMenu.classList.contains("show")) {
          const menuRect = dropdownMenu.getBoundingClientRect();
          const viewportWidth = window.innerWidth;

          if (menuRect.right > viewportWidth) {
            const overflow = menuRect.right - viewportWidth;
            dropdownMenu.style.left = `-${overflow + 25}px`;
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

      closeButton.addEventListener("click", () => {
        dropdownMenu.classList.remove("show");
        arrow.classList.remove("rotate");
      });

      dropdownMenu.addEventListener("click", (e) => e.stopPropagation());

      const dropdownItems = this.getUniqueSortedTypes(type);

      const isType = type === "type";
      dropdownItems.forEach((item) => {
        const itemHTML = `
        <label class="os-map-dropdown-item">
        <input type="checkbox" value="${item.type}" />
        <span class="os-map-empty-checkbox"></span>
        <span class="os-map-check-icon"></span>
        <span style="${isType ? "background-color: " + item.colorCode : ""}" class="${isType ? "os-map-badge " + item.type.toLowerCase() : ""}">
        ${type === "state" ? stateMapper[item.type.trim()] : item.type}
        </span>
        </label>
        `;
        menuList.innerHTML += itemHTML;
      });

      const checkboxes = container.querySelectorAll("input[type=checkbox]");

      resetButton.addEventListener("click", () => {
        checkboxes.forEach((checkbox) => {
          checkbox.checked = false;
        });

        if (type === "type") {
          this.selectedTypes = [];
        } else if (type === "size") {
          this.selectedSizes = [];
        } else if (type === "state") {
          this.selectedStates = [];
        }

        const filteredData = this.getFilteredData();
        this.map.getSource("locations").setData(filteredData);
        countElement.innerHTML = "";
      });

      return {
        countElement: countElement,
        checkboxes: checkboxes,
      };
    };

    const typeFilterSetup = setupDropdown("os-map-filter-type", "type");
    const sizeFilterSetup = setupDropdown("os-map-filter-size", "size");
    const stateFilterSetup = setupDropdown("os-map-filter-state", "state");

    const setCount = (element, count) => {
      if (count === 0) {
        element.innerHTML = "";
      } else {
        element.innerHTML = `(${count})`;
      }
    };

    typeFilterSetup.checkboxes.forEach((input) => {
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
        setCount(typeFilterSetup.countElement, this.selectedTypes.length);
      });
    });

    sizeFilterSetup.checkboxes.forEach((input) => {
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
        setCount(sizeFilterSetup.countElement, this.selectedSizes.length);
      });
    });

    stateFilterSetup.checkboxes.forEach((input) => {
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
        setCount(stateFilterSetup.countElement, this.selectedStates.length);
      });
    });
  }

  setupLegend() {
    let debounceTimer;
    const legendContainer = document.createElement("div");
    const mapContainer = document.getElementById(this.mapId);
    const zoomButton = document.querySelector(".mapboxgl-ctrl-zoom-in");
    legendContainer.classList.add("os-map-legend");
    this.appendChild(legendContainer);

    const legendItems = this.getUniqueSortedTypes("type");
    legendItems.forEach((item) => {
      const itemHTML = `
      <div class="os-map-legend-item">
        <span style="background-color: ${item.colorCode};" class="os-map-legend-color ${item.type.toLowerCase()}"></span>
        <span class="os-map-legend-text">${item.type}</span>
      </div>
      `;
      legendContainer.innerHTML += itemHTML;
    });

    if (zoomButton) {
      const setLegendPosition = () => {
        const legendWidth = legendContainer.getBoundingClientRect().width;
        const zoomButtonsWidth = zoomButton.getBoundingClientRect().width * 3.5;
        const mapWidth = mapContainer.getBoundingClientRect().width;
        if (legendWidth >= mapWidth - zoomButtonsWidth) {
          legendContainer.classList.add("os-map-legend-bottom-position");
        } else {
          legendContainer.classList.remove("os-map-legend-bottom-position");
        }
      };
      setLegendPosition();
      window.addEventListener("resize", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(setLegendPosition, 300);
      });
    }
  }

  setupEventHandlers() {
    const map = this.map;
    let expandedCircle = null;

    if (this.viewportBounds) {
      let debounceTimer;
      window.addEventListener("resize", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.map.fitBounds(this.viewportBounds, {
            padding: { top: 10, bottom: 10, left: 10, right: 10 },
          });
        }, 300);
      });
    }

    const openPopup = (e) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const properties = e.features[0].properties;
      const viewportWidth = window.innerWidth;

      const popup = new mapboxgl.Popup({
        offset: 20,
        maxWidth: viewportWidth > 600 ? "350px" : "250px",
      })
        .setLngLat(coordinates)
        .setHTML(this.buildPopupContent(properties))
        .addTo(map);

      popup.addClassName("open");
      popup.on("close", () => {
        popup.removeClassName("open");
      });
    };

    map.on("click", "unclustered-point", openPopup);
    map.on("click", "expanded-cluster-points", openPopup);

    // Hide expanded cluster and lines on map click
    map.on("click", (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["clusters", "expanded-cluster-points"],
      });

      if (features.length === 0 && expandedCircle) {
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

        map.setFilter("clusters", ["has", "point_count"]);
        map.setLayoutProperty("unclustered-point", "icon-allow-overlap", true);

        // Animate fade in of clusters
        let opacity = 0;
        const clusterFilter = ["within", expandedCircle];
        const fadeInClusters = () => {
          expandedCircle = null;
          if (opacity < 1) {
            opacity += 0.05;
            map.setPaintProperty("clusters", "circle-opacity", [
              "case",
              clusterFilter,
              opacity,
              1,
            ]);
            map.setPaintProperty("cluster-count", "text-opacity", [
              "case",
              clusterFilter,
              opacity,
              1,
            ]);
            requestAnimationFrame(fadeInClusters);
          }
        };

        fadeInClusters();
      }
    });

    map.on("click", "clusters", (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["clusters"],
      });
      const clusterId = features[0].properties.cluster_id;
      const clusterCenter = features[0].geometry.coordinates;
      map.setFilter("clusters", ["has", "point_count"]);

      if (this.mapRefocus) {
        map.easeTo({
          center: clusterCenter,
          duration: 500,
        });
      }
      map.setLayoutProperty("unclustered-point", "icon-allow-overlap", false);

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

          const normalize = (value) => {
            return value?.toLowerCase().trim();
          };

          clusterFeatures = clusterFeatures
            .sort((a, b) => {
              const cityA = normalize(a.properties.city);
              const cityB = normalize(b.properties.city);
              const nameA = normalize(a.properties.name);
              const nameB = normalize(b.properties.name);

              if (cityA + " " + nameA < cityB + " " + nameB) return -1;
              if (cityA + " " + nameA > cityB + " " + nameB) return 1;

              return 0;
            })
            .map((feature, index) => {
              const angle =
                ((clusterFeatures.length - index) / clusterFeatures.length) *
                  2 *
                  Math.PI +
                Math.PI / 2;

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

          const lineDistance = turf.length(linesData.features[0], {
            units: "kilometers",
          });
          const circleRadius = lineDistance * 1.8;
          expandedCircle = turf.circle(clusterCenter, circleRadius, {
            units: "kilometers",
          });

          // Animate fade out of clusters
          let opacity = 1;
          const clusterFilter = [
            "all",
            ["!=", ["get", "cluster_id"], clusterId],
            ["within", expandedCircle],
          ];
          const fadeOutClusters = () => {
            if (opacity > 0) {
              opacity -= 0.05; // Adjust the decrement for speed of fade
              map.setPaintProperty("clusters", "circle-opacity", [
                "case",
                clusterFilter,
                opacity,
                ["case", ["within", expandedCircle], 0, 1],
              ]);
              map.setPaintProperty("cluster-count", "text-opacity", [
                "case",
                clusterFilter,
                opacity,
                ["case", ["within", expandedCircle], 0, 1],
              ]);
              requestAnimationFrame(fadeOutClusters);
            } else {
              map.setFilter("clusters", [
                "all",
                ["has", "point_count"],
                ["!", ["within", expandedCircle]],
              ]);
            }
          };

          if (expandedCircle) {
            fadeOutClusters();
          }

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
                "icon-image": ["concat", "marker-", ["get", "colorCode"]],
                "icon-size": 0.8,
                "icon-allow-overlap": true,
              },
            });
          } else {
            map
              .getSource("expanded-cluster")
              .setData(expandedClusterSource.data);
          }
        });
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
      map.setFilter("clusters", ["has", "point_count"]);
      map.setPaintProperty("clusters", "circle-opacity", 1);
      map.setPaintProperty("cluster-count", "text-opacity", 1);
      map.setLayoutProperty("unclustered-point", "icon-allow-overlap", true);
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
    <span style="background-color: ${properties.colorCode};" class="os-map-badge ${properties.type.toLowerCase()}">${properties.type}</span>
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

  buildBounds(west, south, east, north) {
    return west && south && east && north
      ? [
          [west, south],
          [east, north],
        ]
      : null;
  }

  getUniqueSortedTypes(type) {
    return Object.values(
      this.originalData.features.reduce((acc, feature) => {
        const typeValue = feature.properties[type];
        acc[typeValue] = {
          type: typeValue,
          colorCode: feature.properties.colorCode,
        };
        return acc;
      }, {}),
    ).sort((a, b) => a.type.localeCompare(b.type));
  }
}

customElements.define("os-map", OSMap);
