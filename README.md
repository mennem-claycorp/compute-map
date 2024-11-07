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