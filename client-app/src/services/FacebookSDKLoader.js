let fbInitResolve;
const fbInitPromise = new Promise((resolve) => {
  fbInitResolve = resolve;
});

export default function FacebookSDKLoader() {
  useEffect(() => {
    if (document.getElementById("facebook-jssdk")) return;

    console.log("FB App ID:", import.meta.env.VITE_FACEBOOK_APP_ID);

    window.fbAsyncInit = function () {
      FB.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v23.0",
      });
      console.log("Facebook SDK initialized");
      window.fbInitialized = true;
      fbInitResolve();
    };

    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      console.log("Facebook SDK script loaded");
    };

    script.onerror = () => {
      console.error("Facebook SDK failed to load");
    };
  }, []);

  return null;
}

export { fbInitPromise };
