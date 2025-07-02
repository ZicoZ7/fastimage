# Google Play Store Deployment Guide

## Prerequisites

1. **Install EAS CLI**:

```bash
npm install -g @expo/eas-cli
```

2. **Create Expo Account**:

```bash
eas login
```

3. **Google Play Console Account** (requires $25 one-time fee)

## Step 1: Configure Your Project

1. **Update app.json** ✅ (Already done)
2. **Create EAS configuration** ✅ (Already done)
3. **Set up project ID**:

```bash
eas init
```

## Step 2: Build for Production

1. **Build Android App Bundle (AAB)**:

```bash
eas build --platform android --profile production
```

2. **Alternative: Build APK for testing**:

```bash
eas build --platform android --profile preview
```

## Step 3: Google Play Console Setup

### A. Create App in Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Click "Create app"
3. Fill in app details:
   - **App name**: "FastImage - AI Image Generator"
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free

### B. Upload App Bundle

1. Go to "Production" → "Releases"
2. Click "Create new release"
3. Upload the `.aab` file from EAS build
4. Fill in release notes

### C. Store Listing

Use the information from `store-config.json`:

**App details**:

- Short description: "Generate stunning AI images with text prompts and play Diamond Dash game"
- Full description: [Copy from store-config.json]

**Graphics**:

- App icon: 512x512 PNG
- Feature graphic: 1024x500 PNG
- Screenshots: At least 2, up to 8 (1080x1920 for phone)

**Categorization**:

- App category: Art & Design
- Content rating: Everyone

### D. Content Rating

1. Go to "Content rating"
2. Complete the questionnaire
3. Should result in "Everyone" rating

### E. Target Audience

1. Select age groups: 13+ (recommended for AI content)
2. Appeals to children: No

### F. Privacy Policy

1. Add privacy policy URL: `https://github.com/yourusername/fastimage/blob/main/PRIVACY.md`

## Step 4: Release Process

### Internal Testing (Recommended First)

```bash
eas submit --platform android --track internal
```

### Production Release

```bash
eas submit --platform android --track production
```

## Step 5: Required Assets

Create these assets for the store:

### App Icons

- **App icon**: 512x512 PNG (no transparency)
- **Adaptive icon**: Already configured in app.json

### Screenshots

Take screenshots of:

1. Image generation screen
2. Generated image example
3. Diamond Dash game
4. App settings/features

### Feature Graphic

- **Size**: 1024x500 pixels
- **Content**: Showcase app features with text overlay

## Commands Summary

```bash
# Install dependencies
npm install

# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Initialize EAS project
eas init

# Build for production (Android App Bundle)
eas build --platform android --profile production

# Submit to Google Play Store
eas submit --platform android

# Check build status
eas build:list

# View build logs
eas build:view [BUILD_ID]
```

## Troubleshooting

### Common Issues:

1. **Build fails**: Check dependencies and Expo SDK compatibility
2. **Upload rejected**: Ensure all store listing requirements are met
3. **Permission issues**: Verify all required permissions are declared

### Build Optimization:

```bash
# Clear cache if build fails
expo r -c

# Update dependencies
npx expo install --fix
```

## Post-Release

1. **Monitor**: Check Google Play Console for crashes/ANRs
2. **Updates**: Use `eas build` and `eas submit` for updates
3. **Version bumps**: Update `version` and `versionCode` in app.json

## Store Optimization

- **Keywords**: AI image generator, text to image, art generator
- **Screenshots**: Show actual app functionality
- **Description**: Highlight key features and benefits
- **Reviews**: Encourage users to leave positive reviews

---

**Note**: Replace placeholder URLs and contact information with your actual details before deployment.
