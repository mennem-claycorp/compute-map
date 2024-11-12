# os-map

## Usage

Add the `<os-map>` component to your interface using the following attributes:

# Attributes

| Attribute           | Description                                  | Example                              |
| ------------------- | -------------------------------------------- | ------------------------------------ |
| `id`                | Specifies the unique map container id        | `map`                                |
| `data-os-endpoint`  | Specifies the endpoint where data is fetched | `https://api.example.com/data`       |
| `data-os-key`       | Your public Mapbox API key                   | `pk.eyJ1...`                         |
| `data-os-map-lat`   | Initial latitude position of the map         | `39.8283`                            |
| `data-os-map-lng`   | Initial longitude position of the map        | `-98.5795`                           |
| `data-os-map-zoom`  | Initial zoom level of the map                | `4`                                  |
| `data-os-map-style` | Mapbox style to be used for the map          | `mapbox://styles/mapbox/streets-v11` |
| `data-os-map-lock`  | Prevents map zooming when scrolling          | `true`                               |

# Development

Available commands:

- `npm run build` - Builds the project using webpack
- `npm run watch` - Watches for changes and rebuilds automatically

# Styling

The map dimensions can be controlled by setting the height and width of the `.os-map-container` class.

## Example:

```css
.os-map-container {
  height: 800px; /* Height is 1000px by default */
  width: 1000px; /* Width is 100% by default */
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
- `.os-map-dropdown-item` - Individual dropdown option
- `.os-map-empty-checkbox` - Unchecked checkbox style
- `.os-map-check-icon` - Checked checkbox style
- `.os-map-arrow` - Dropdown arrow indicator
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
