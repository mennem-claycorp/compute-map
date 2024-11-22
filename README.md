# Usage

Add the `<os-map>` component to your page using the following attributes:

# Attributes

| Attribute                 | Description                                           | Example                              |
| ------------------------- | ----------------------------------------------------- | ------------------------------------ |
| `data-os-map-id`          | The unique map container id                 | `map`                                |
| `data-os-map-endpoint`    | The endpoint where data is fetched          | `https://api.example.com/data`       |
| `data-os-map-key`         | Your public Mapbox API key                            | `pk.eyJ1...`                         |
| `data-os-map-lat`         | Initial latitude position of the map                  | `39.8283`                            |
| `data-os-map-lng`         | Initial longitude position of the map                 | `-98.5795`                           |
| `data-os-map-zoom`        | Initial zoom level of the map                         | `4`                                  |
| `data-os-map-zoom-max`        | Max zoom level of the map                         | `6`                                  |
| `data-os-map-zoom-min`        | Min zoom level of the map                         | `2`                                  |
| `data-os-map-style`       | Mapbox style to be used for the map                   | `mapbox://styles/mapbox/streets-v11` |
| `data-os-map-lock`        | Prevents map zooming when scrolling                   | `true`                               |
| `data-os-map-projection`  | Specifies which projection the map is rendered in. Available values: "albers", "equalEarth", "equirectangular", "lambertConformalConic", "mercator", "naturalEarth", "winkelTripel", "globe". Defaults to "mercator" | `mercator`                               |
| `data-os-map-refocus`  | Re-centers the map to focus on the selected cluster  | `false`                               |
| `data-os-map-bound-west`  | The western longitude limit of the map bounds | `-122.66`                         |
| `data-os-map-bound-south` | The southern latitude limit of the map bounds | `37.49`                          |
| `data-os-map-bound-east`  | The eastern longitude limit of the map bounds | `-122.25`                        |
| `data-os-map-bound-north` | The northern latitude limit of the map bounds | `37.87`                          |
| `data-os-map-viewport-west`  | The western longitude viewport boundary of the map | `-124.66`                         |
| `data-os-map-viewport-south` | The southern latitude viewport boundary of the map | `39.49`                          |
| `data-os-map-viewport-east`  | The eastern longitude viewport boundary of the map | `-124.25`                        |
| `data-os-map-viewport-north` | The northern latitude viewport boundary of the map | `38.87`                          |

# Map Viewport Boundaries Configuration

 `data-os-map-viewport-*` attributes specify the geographical bounds of the map to ensure it fits perfectly within the visible area of your application.
```html
<os-map 
    ***
    data-os-map-viewport-west="-122.66" 
    data-os-map-viewport-south="37.49" 
    data-os-map-viewport-east="-122.25" 
    data-os-map-viewport-north="37.87">
</os-map>
```


# Update map data

You can dynamically update the map's data by passing in a GeoJSON object.

```html
<textarea></textarea>
<button>Set data</button>
<os-map
  data-os-map-lat="39.8283"
  data-os-map-lng="-98.5795"
  data-os-map-zoom="4"
  data-os-map-style="mapbox://styles/mapbox/light-v11"
  data-os-map-key="pk.eyJ1..."
></os-map>

<script>
  document.querySelector("button").addEventListener("click", function () {
    const map = document.querySelector("os-map");
    const value = document.querySelector("textarea").value;

    map.setData(JSON.parse(value));
  });
</script>
```

GeoJSON object should have next structure:

```
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-84.388, 33.749]
      },
      "properties": {
        "name": "Campus 1",
        "type": "Colocation",
        "city": "Atlanta",
        "state": "GA",
        "region": "Southeast",
        "size": "30+ MW",
        "image": "http://image.jpg",
        "integratedServices": "",
        "iconUrl": "http://icon.png",
        "colorCode": "#4E2751"
      }
    }
  ]
}
```

# Fallback content
To handle scenarios where Mapbox GL is unsupported by the browser, include the fallback content within the <os-map> tag. 

```html
<os-map>
    <img src="https://example.com/image.png" />
</os-map>
```

# Styling

The map dimensions can be controlled by setting the height and width of the `.os-map-container` class.

```css
.os-map-container {
  height: 800px;
  width: 1000px;
}
```

The `<os-map>` component provides the following CSS classes for custom styling. Note that Mapbox-specific classes should be prefixed with `.os-map-container` for proper specificity:

## Map Structure

- `.os-map-container` - Main map wrapper
- `.os-map-conteiner .mapboxgl-map` - The map element itself

## Filters

- `.os-map-filters` - Filters container
- `.os-map-filters-title` - Filters section title
- `.os-map-filters-dropdowns` - Container for all dropdown elements

### Dropdown Elements

- `.os-map-dropdown` - Individual dropdown container
- `.os-map-dropdown-toggle` - Dropdown button
- `.os-map-dropdown-menu` - Dropdown content panel
- `.os-map-dropdown-menu-list` - Dropdown content list
- `.os-map-dropdown-menu-header` - Dropdown header
- `.os-map-dropdown-menu-footer` - Dropdown footer
- `.os-map-dropdown-item` - Individual dropdown option
- `.os-map-empty-checkbox` - Unchecked checkbox style
- `.os-map-check-icon` - Checked checkbox style
- `.os-map-arrow` - Dropdown arrow indicator
- `.os-map-filter-reset-button` - Filter reset button
- `.os-map-filter-count` - Selected items count
- `.os-map-dropdown-close-button` - Dropdown close button
- `#os-map-filter-size .os-map-dropdown-menu` - Dropdown content panel for filtering by size
- `#os-map-filter-state .os-map-dropdown-menu` - Dropdown content panel for filtering by state

## Badge Classes

- `.os-map-badge` - Base badge class

## Popup Elements

- `os-map-container .mapboxgl-popup-content` - Main popup container
- `.os-map-popup-content-description` - Popup text content area
- `.os-map-popup-content-footer` - Popup footer
- `.os-map-popup-content-footer-item` - Individual footer item

### Popup Directional Variants

- `.os-map-container .mapboxgl-popup-anchor-right` - Right-aligned popup
- `.os-map-container .mapboxgl-popup-anchor-left` - Left-aligned popup
- `.os-map-container .mapboxgl-popup-anchor-bottom` - Bottom-aligned popup
- `.os-map-container .mapboxgl-popup-anchor-top` - Top-aligned popup

## Map Controls

- `.os-map-container .mapboxgl-ctrl-group` - Controls container
- `.os-map-container .mapboxgl-ctrl-zoom-in` - Zoom in button
- `.os-map-container .mapboxgl-ctrl-zoom-out` - Zoom out button

# Development

Available commands:

- `npm run build` - Builds the project using webpack
- `npm run watch` - Watches for changes and rebuilds automatically
