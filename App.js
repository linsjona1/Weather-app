// API Keys
const unsplashApiKey = "kfnWwwFrdgpUG-_XLlKs32lnqzq75qsm1LGTnGW_0RE";
const weatherApiKey = "10383a64b39b303504010f0651b8dbdf";

// DOM Elements
const searchBar = document.querySelector(".js-search-bar");
const searchBtn = document.querySelector(".search-btn");
const locationBtn = document.querySelector(".js-location-btn");
const errorBanner = document.querySelector(".js-error-banner");
const weatherContainer = document.querySelector(".weather");
const cityEl = document.querySelector(".city");
const timeEl = document.querySelector(".city-time");
const dateEl = document.querySelector(".city-date");
const tempEl = document.querySelector(".temp");
const feelsLikeEl = document.querySelector(".feels-like");
const iconEl = document.querySelector(".icon");
const descEl = document.querySelector(".description");
const humidityEl = document.querySelector(".humidity");
const windEl = document.querySelector(".wind");
const visibilityEl = document.querySelector(".visibility");
const pressureEl = document.querySelector(".pressure");
const weatherMoodEl = document.querySelector(".js-weather-mood");

let currentTimezoneOffset = 0;
let clockInterval = null;

// Curated high-resolution fallback weather photography (Unsplash verified)
const weatherFallbacks = {
   clearDay: "https://images.unsplash.com/photo-1601297183305-6df142704ea2?auto=format&fit=crop&w=1920&q=80",
   clearNight: "https://images.unsplash.com/photo-1509773896068-7fd415d91e2e?auto=format&fit=crop&w=1920&q=80",
   cloudsDay: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1920&q=80",
   cloudsNight: "https://images.unsplash.com/photo-1517685352821-92cf88aee5a5?auto=format&fit=crop&w=1920&q=80",
   rain: "https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=1920&q=80",
   thunderstorm: "https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?auto=format&fit=crop&w=1920&q=80",
   snow: "https://images.unsplash.com/photo-1491002052546-bf38f186af56?auto=format&fit=crop&w=1920&q=80",
   mist: "https://images.unsplash.com/photo-1487621167305-5d248087c724?auto=format&fit=crop&w=1920&q=80"
};

/**
 * Returns curated fallback URL based on weather condition and time of day
 */
function getCuratedFallback(mainCondition, isNight) {
   const condition = (mainCondition || "").toLowerCase();
   if (condition.includes("thunder")) return weatherFallbacks.thunderstorm;
   if (condition.includes("rain") || condition.includes("drizzle")) return weatherFallbacks.rain;
   if (condition.includes("snow")) return weatherFallbacks.snow;
   if (condition.includes("cloud")) return isNight ? weatherFallbacks.cloudsNight : weatherFallbacks.cloudsDay;
   if (condition.includes("clear")) return isNight ? weatherFallbacks.clearNight : weatherFallbacks.clearDay;
   return weatherFallbacks.mist;
}

/**
 * Updates the body and backdrop background image with smooth presentation
 */
function setBackgroundImage(imageUrl) {
   if (!imageUrl) return;
   const img = new Image();
   img.src = imageUrl;
   img.onload = () => {
      const bgBackdrop = document.getElementById("bg-backdrop");
      if (bgBackdrop) {
         bgBackdrop.style.backgroundImage = `url('${imageUrl}')`;
      }
      document.body.style.backgroundImage = `url('${imageUrl}')`;
   };
   img.onerror = () => {
      const fallback = weatherFallbacks.clearDay;
      const bgBackdrop = document.getElementById("bg-backdrop");
      if (bgBackdrop) {
         bgBackdrop.style.backgroundImage = `url('${fallback}')`;
      }
      document.body.style.backgroundImage = `url('${fallback}')`;
   };
}

/**
 * Fetches dynamic background photo representing how the weather looks in that city/condition
 */
async function updateWeatherBackground(cityName, weatherMain, weatherDesc, isNight) {
   const timeOfDay = isNight ? "night" : "day";
   const fallbackUrl = getCuratedFallback(weatherMain, isNight);

   // Multi-tier query strategy to find the most accurate weather photo
   const queries = [
      `${cityName} ${weatherMain} ${timeOfDay}`,
      `${cityName} ${weatherMain}`,
      `${weatherDesc} ${timeOfDay} sky`,
      `${weatherMain} weather sky ${timeOfDay}`
   ];

   for (const query of queries) {
      try {
         const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&client_id=${unsplashApiKey}`;
         const response = await fetch(url);
         if (response.ok) {
            const data = await response.json();
            const imageUrl = data.urls && (data.urls.regular || data.urls.full || data.urls.raw);
            if (imageUrl) {
               setBackgroundImage(imageUrl);
               if (weatherMoodEl) {
                  weatherMoodEl.textContent = `Visual: ${weatherDesc} in ${cityName} (${timeOfDay})`;
               }
               return;
            }
         }
      } catch (err) {
         // Silently try next query candidate
      }
   }

   // If Unsplash has no matching photo or rate limit reached, use guaranteed high quality curated visual
   setBackgroundImage(fallbackUrl);
   if (weatherMoodEl) {
      weatherMoodEl.textContent = `Visual: ${weatherDesc} (${timeOfDay})`;
   }
}

/**
 * Calculates and starts the live ticking clock for the city's timezone
 */
function startCityClock(timezoneOffsetSeconds) {
   currentTimezoneOffset = timezoneOffsetSeconds;

   if (clockInterval) {
      clearInterval(clockInterval);
   }

   const updateClock = () => {
      const now = new Date();
      // UTC time in milliseconds
      const utcMillis = now.getTime() + (now.getTimezoneOffset() * 60000);
      // City local time
      const cityDate = new Date(utcMillis + (currentTimezoneOffset * 1000));

      timeEl.textContent = cityDate.toLocaleTimeString([], {
         hour: "2-digit",
         minute: "2-digit",
         second: "2-digit",
         hour12: true
      });

      dateEl.textContent = cityDate.toLocaleDateString([], {
         weekday: "short",
         month: "short",
         day: "numeric",
         year: "numeric"
      });
   };

   updateClock();
   clockInterval = setInterval(updateClock, 1000);
}

/**
 * Displays error message in the UI banner
 */
function showError(message) {
   if (!errorBanner) return;
   errorBanner.textContent = message;
   errorBanner.style.display = "block";
   weatherContainer.classList.remove("loading");
}

/**
 * Clears error banner
 */
function clearError() {
   if (!errorBanner) return;
   errorBanner.textContent = "";
   errorBanner.style.display = "none";
}

/**
 * Renders the weather data object on the page
 */
function renderWeatherData(result) {
   clearError();

   const cityName = result.name;
   const country = result.sys && result.sys.country ? `, ${result.sys.country}` : "";
   const temp = Math.round(result.main.temp);
   const feelsLike = Math.round(result.main.feels_like);
   const weatherInfo = result.weather && result.weather[0] ? result.weather[0] : {};
   const weatherMain = weatherInfo.main || "Clear";
   const weatherDesc = weatherInfo.description || "clear sky";
   const iconCode = weatherInfo.icon || "01d";
   const isNight = iconCode.endsWith("n");
   const humidity = result.main.humidity;
   const windSpeed = (result.wind.speed * 3.6).toFixed(1); // convert m/s to km/h
   const visibilityKm = result.visibility ? (result.visibility / 1000).toFixed(1) : "N/A";
   const pressure = result.main.pressure;

   // Update city name and country
   cityEl.textContent = `${cityName}${country}`;

   // Update temperature and feels-like
   tempEl.textContent = `${temp}°C`;
   feelsLikeEl.textContent = `Feels like: ${feelsLike}°C`;

   // Update icon and description
   iconEl.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
   iconEl.alt = weatherDesc;
   descEl.textContent = weatherDesc;

   // Update metrics
   humidityEl.textContent = `${humidity}%`;
   windEl.textContent = `${windSpeed} km/h`;
   visibilityEl.textContent = visibilityKm !== "N/A" ? `${visibilityKm} km` : "N/A";
   pressureEl.textContent = `${pressure} hPa`;

   // Start the live city clock for this city's exact timezone
   startCityClock(result.timezone || 0);

   // Update background image to match the weather condition and city
   updateWeatherBackground(cityName, weatherMain, weatherDesc, isNight);

   // Reveal weather card
   weatherContainer.classList.remove("loading");
}

/**
 * Fetches accurate weather data by City Name
 */
async function GetWeather(city) {
   if (!city) return;
   clearError();
   weatherContainer.classList.add("loading");

   try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${weatherApiKey}&units=metric`;
      const response = await fetch(url);

      if (!response.ok) {
         if (response.status === 404) {
            throw new Error(`City "${city}" not found. Please verify the spelling and try again.`);
         } else {
            throw new Error(`Weather service error (${response.status}). Please try again later.`);
         }
      }

      const result = await response.json();
      renderWeatherData(result);
   } catch (error) {
      console.error("GetWeather error:", error);
      showError(error.message || "Failed to load weather data.");
   }
}

/**
 * Fetches accurate weather data by latitude and longitude coordinates
 */
async function fetchWeatherByCoords(lat, lon) {
   clearError();
   weatherContainer.classList.add("loading");

   try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`;
      const response = await fetch(url);

      if (!response.ok) {
         throw new Error(`Unable to fetch weather for your coordinates (${response.status})`);
      }

      const result = await response.json();
      renderWeatherData(result);
   } catch (error) {
      console.error("fetchWeatherByCoords error:", error);
      showError(error.message || "Could not retrieve weather for your coordinates.");
   }
}

/**
 * Automatically detects user's location on startup and loads their default city
 */
async function loadUserDefaultCity() {
   weatherContainer.classList.add("loading");
   cityEl.textContent = "Detecting your location...";

   // 1. Try Browser HTML5 Geolocation first
   if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
         (position) => {
            const { latitude, longitude } = position.coords;
            fetchWeatherByCoords(latitude, longitude);
         },
         async (geoError) => {
            console.log("Browser geolocation not available or denied, falling back to IP detection:", geoError.message);
            await fallbackToIPLocation();
         },
         {
            timeout: 5000,
            maximumAge: 300000,
            enableHighAccuracy: false
         }
      );
   } else {
      await fallbackToIPLocation();
   }
}

/**
 * Fallback to IP-based city detection if geolocation is denied or unsupported
 */
async function fallbackToIPLocation() {
   try {
      const ipRes = await fetch("https://ipwho.is/");
      if (ipRes.ok) {
         const ipData = await ipRes.json();
         if (ipData && ipData.success && ipData.latitude && ipData.longitude) {
            await fetchWeatherByCoords(ipData.latitude, ipData.longitude);
            return;
         } else if (ipData && ipData.city) {
            await GetWeather(ipData.city);
            return;
         }
      }
   } catch (e) {
      console.warn("IP geolocation failed:", e);
   }

   // Default fallback city if all detection methods fail
   GetWeather("London");
}

// Event Listeners
function handleSearch() {
   const query = searchBar.value.trim();
   if (!query) return;
   GetWeather(query);
   searchBar.value = "";
}

searchBtn.addEventListener("click", handleSearch);

searchBar.addEventListener("keyup", (event) => {
   if (event.key === "Enter") {
      handleSearch();
   }
});

// "My Location" button click
if (locationBtn) {
   locationBtn.addEventListener("click", () => {
      loadUserDefaultCity();
   });
}

// Automatically detect user city on app launch
loadUserDefaultCity();
