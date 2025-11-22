# Google Maps API Setup Guide

## Current Status
Your Google Maps API key is: `AIzaSyAJH6A6pkOEkVjtjQo80qDRVHSIafPdUxQ`

## Required Steps for Production

### 1. Enable Required APIs
Go to [Google Cloud Console](https://console.cloud.google.com/) and enable these APIs:
- **Maps JavaScript API** (for map display)
- **Geocoding API** (for address lookup)
- **Distance Matrix API** (for distance calculations)
- **Places API** (for location search)

### 2. Configure API Key Restrictions
1. Go to "APIs & Services" > "Credentials"
2. Click on your API key
3. Under "Application restrictions":
   - Choose "HTTP referrers (web sites)"
   - Add your domains:
     - `localhost:*` (for development)
     - `yourdomain.com/*` (for production)
     - `*.yourdomain.com/*` (for subdomains)

### 3. Set Billing
- Ensure billing is enabled for your Google Cloud project
- Google Maps requires a billing account even for free tier usage

### 4. API Key Permissions
Make sure your API key has access to:
- Maps JavaScript API
- Geocoding API
- Distance Matrix API
- Places API

## Common Issues & Solutions

### Issue: "This page didn't load Google Maps correctly"
**Solutions:**
1. Check if Maps JavaScript API is enabled
2. Verify API key restrictions allow your domain
3. Ensure billing is set up
4. Check browser console for specific error messages

### Issue: "RefererNotAllowedMapError"
**Solution:**
- Add your domain to the HTTP referrers list in API key restrictions

### Issue: "BillingNotEnabledMapError"
**Solution:**
- Set up billing in Google Cloud Console

### Issue: "RequestDeniedMapError"
**Solution:**
- Check if the required APIs are enabled
- Verify API key has correct permissions

## Testing Your Setup

1. **Development Test**: Visit `http://localhost:8080/ops/map`
2. **Console Check**: Open browser dev tools and look for Google Maps errors
3. **Network Tab**: Check if Google Maps API requests are successful

## Production Deployment

### For Netlify:
1. Add environment variable: `VITE_GOOGLE_MAPS_KEY=your_api_key`
2. Update API key restrictions to include your Netlify domain
3. Deploy and test

### For Other Hosting:
1. Set environment variable in your hosting platform
2. Update API key restrictions to include your domain
3. Deploy and test

## Security Best Practices

1. **Restrict API Key**: Always use HTTP referrer restrictions
2. **Monitor Usage**: Set up billing alerts
3. **Rotate Keys**: Regularly rotate API keys
4. **Environment Variables**: Never commit API keys to version control

## Current Implementation

The app is configured to use Google Maps with:
- Real-time vehicle tracking
- Zone visualization
- Clustering for performance
- Interactive markers and popups
- Professional styling

## Support

If you continue to have issues:
1. Check Google Cloud Console for API status
2. Verify billing is active
3. Test with a simple HTML page first
4. Contact Google Cloud Support if needed






