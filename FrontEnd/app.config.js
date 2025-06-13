import 'dotenv/config';

export default {
  expo: {
    name: "OndeFica",
    slug: "OndeFica",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "com.gusta.ondefica",
    icon: "./assets/placeholder.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/placeholder.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.gusta.ondefica",
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
      }
    },
    android: {
      package: "com.gusta.ondefica",
      adaptiveIcon: {
        foregroundImage: "./assets/placeholder.png",
        backgroundColor: "#FFFFFF"
      },
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY
        }
      }
    },
    web: {
      favicon: "./assets/placeholder.png"
    },
    extra: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      eas: {
        projectId: "328d592b-0531-44d3-87ba-bafc1fe92ea5"
      }
    }
  }
};
