# os-map

## Usage

Add the `<os-map>` component to your interface using the following attributes:

# Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| `id` | Specifies the unique map container id | `map` |
| `data-os-endpoint` | Specifies the endpoint where data is fetched | `https://api.example.com/data` |
| `data-os-key` | Your public Mapbox API key | `pk.eyJ1...` |
| `data-os-map-lat` | Initial latitude position of the map | `39.8283` |
| `data-os-map-lng` | Initial longitude position of the map | `-98.5795` |
| `data-os-map-zoom` | Initial zoom level of the map | `4` |
| `data-os-map-style` | Mapbox style to be used for the map | `mapbox://styles/mapbox/streets-v11` |

# Development

Available commands:

- `npm run build` - Builds the project using webpack
- `npm run watch` - Watches for changes and rebuilds automatically

# Styling

Note: All classes should be prefixed with `os-map` when styling to ensure proper specificity. 

The `<os-map>` component provides the following CSS classes for custom styling:

## Map Structure
- `.map-container` - Main map wrapper
- `.mapboxgl-map` - The map element itself

## Filters
- `.filters` - Filters container
- `.filters-title` - Filters section title
- `.filters-dropdowns` - Container for all dropdown elements

### Dropdown Elements
- `.dropdown` - Individual dropdown container
- `.dropdown-toggle` - Dropdown button
- `.dropdown-menu` - Dropdown content panel
- `.dropdown-item` - Individual dropdown option
- `.empty-checkbox` - Unchecked checkbox style
- `.check-icon` - Checked checkbox style
- `.arrow` - Dropdown arrow indicator

## Badge Classes
- `.badge` - Base badge class

## Popup Elements
- `.mapboxgl-popup-content` - Main popup container
- `.popup-content-description` - Popup text content area
- `.popup-content-footer` - Popup footer
- `.popup-content-footer-item` - Individual footer item

### Popup Directional Variants
- `.mapboxgl-popup-anchor-right` - Right-aligned popup
- `.mapboxgl-popup-anchor-left` - Left-aligned popup
- `.mapboxgl-popup-anchor-bottom` - Bottom-aligned popup
- `.mapboxgl-popup-anchor-top` - Top-aligned popup

## Map Controls
- `.mapboxgl-ctrl-group` - Controls container
- `.mapboxgl-ctrl-zoom-in` - Zoom in button
- `.mapboxgl-ctrl-zoom-out` - Zoom out button

## Example usage:
```css
os-map {
  .map-container {
    height: 800px;
  }
  .filters {
    background-color: #f5f5f5;
  }
  .mapboxgl-popup-content {
    background-color: #fafafa;
    border-radius: 8px;
  }
  .dropdown-toggle {
    font-weight: bold;
    text-transform: uppercase;
  }
}
```
