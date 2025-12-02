# Google Maps API Security Guide

> **⚠️ DEPRECATED**: This documentation is no longer relevant. The application now uses **Leaflet.js** with free **Nominatim** geocoding (OpenStreetMap) instead of Google Maps API.
> 
> **Why:** Zero API costs, no API key management, smaller bundle size.
> 
> See: `docs/02-features/WORLDWIDE_ADDRESS_SUPPORT.md` for current address lookup implementation.

---

## 🔐 API Key Security (Legacy)

The Google Maps API key was previously secured using environment variables. Here's how it was set up:

### 1. Environment Variable Setup (Legacy)

Previously, you would create a `.env.local` file in your project root:

```bash
# Google Maps API Key (NO LONGER NEEDED)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Note:** This is no longer required as the application now uses Leaflet.js with free Nominatim geocoding.

### 2. Google Cloud Console Security

**CRITICAL**: You must restrict this API key in Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Find your API key and click "Edit"
4. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add your domain: `https://taklaget-service-app.web.app/*`
   - Add localhost for development: `http://localhost:*/*`
5. Under "API restrictions":
   - Select "Restrict key"
   - Enable only these APIs:
     - Maps JavaScript API
     - Places API
     - Maps Static API
6. Save the changes

### 3. API Usage Limits

The current implementation uses:
- **Places API**: For address autocomplete (5 suggestions per query)
- **Maps Static API**: For satellite imagery (600x400px, zoom level 19)

### 4. Cost Monitoring

Monitor your usage in Google Cloud Console:
- Go to "APIs & Services" > "Dashboard"
- Check "Maps Static API" and "Places API" usage
- Set up billing alerts if needed

### 5. Features Implemented

✅ **Address Autocomplete**: Real-time suggestions as you type
✅ **Satellite View**: High-resolution building imagery (zoom level 19)
✅ **Larger Map**: 600x400px for better visibility
✅ **Secure API Key**: Environment variable with domain restrictions
✅ **Worldwide Address Support**: Searches addresses from any country
✅ **Keyboard Navigation**: Arrow keys, Enter, Escape support
✅ **Error Handling**: Graceful fallbacks for invalid addresses

### 6. Usage Guidelines

- The API key is restricted to your domain only
- No public access to the API key
- Automatic fallback if API key is missing
- Debounced requests to minimize API calls
- Global address support for all countries

## 🚀 Deployment

The feature is now live with:
- Address autocomplete with worldwide support
- Larger satellite map (600x400px)
- Secure API key implementation
- Better user experience for roof inspectors

Visit: https://taklaget-service-app.web.app
