document.querySelector(".js-search-bar").focus();
const apiKey = "kfnWwwFrdgpUG-_XLlKs32lnqzq75qsm1LGTnGW_0RE";
const mainBackground = document.querySelector("body");
let ImageDescription = "";

// screen dimensions and device pixel ratio for sharper images on high-DPI displays
const getViewportSize = () => {
   const dpr = window.devicePixelRatio || 1;
   return {
      w: Math.round(window.innerWidth * dpr),
      h: Math.round(window.innerHeight * dpr),
      dpr
   };
};

async function GetBackground(city){
   if (!city) return;

   // request a random photo for the city
   const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(city)}&client_id=${apiKey}`;

   // encodeURIcomponent means to convert the user data into readable format for the api call. Incase of any space or any special character.
   // reponse.ok tells if the fetch api was successful or not.

   try{
      const response = await fetch(url);
      if (!response.ok) {
         throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      // console.log(data);
      const description = data.alt_description || data.description || '';

      // use the raw URL and append sizing params supported by Unsplash (w, h, fit, q)
      const vp = getViewportSize();
      // ensure the raw base ends with a ? or doesn't already have query params
      // data.urls.raw is typically a base URL; append parameters with ?
      const rawBase = data.urls && data.urls.raw;
      const sizedUrl = `${rawBase}?w=${vp.w}&h=${vp.h}&fit=crop&q=80&dpr=${vp.dpr}`;

      const rawImage = sizedUrl;

      if (!rawImage) {
         console.warn('No image URL returned from Unsplash', data);
         return;
      }

         // set background (CSS `background-size: cover` will crop as needed)
         mainBackground.style.backgroundImage = `url(${rawImage})`;

         // update stored description and UI
         ImageDescription = city || description || '';
         const imageDescEl = document.querySelector('.image-description');
         if (imageDescEl) {
            const formatted = ImageDescription
               ? ImageDescription.charAt(0).toUpperCase() + ImageDescription.slice(1)
               : '';
            imageDescEl.textContent = `Background: ${formatted}`;
         }

   }
   catch(error){
      console.error('GetBackground error =', error);
   }
}

const searchBar = document.querySelector('.js-search-bar');
const enterbtn = document.querySelector('.search-btn');
enterbtn.addEventListener('click', () => {
   const city = searchBar.value.trim();
   if (!city) return;
   GetBackground(city);
   GetWeather(city);
   searchBar.value = '';
});

if (searchBar) {
   searchBar.addEventListener('keyup', (event) => {
      if (event.key === 'Enter'){
         const city = searchBar.value.trim();
         if (!city) return;
         GetBackground(city);
         GetWeather(city);
         searchBar.value = '';
      }
   });
} else {
   console.warn('Search input (.js-search-bar) not found');
}


// const WeatherURL = "https://api.openweathermap.org/data/2.5/weather?q={city name}&appid={API key}";
const weatherApiKey = "10383a64b39b303504010f0651b8dbdf";

async function GetWeather(city){    
   try{
   const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${weatherApiKey}&units=metric`);
   if(!response.ok){
      throw new Error (`Open weather API error: ${response.status}, ${response.statusText}`)
   }
   const result = await response.json();
   let weatherDescription = result.weather[0].description;
//   if(weatherDescription = 'Broken Clouds'){
//       weatherDescription ='Partly Cloudy'};
   ImageDescription = ` ${weatherDescription} in ${city}`;
   console.log(result.sys.country);
    console.log(ImageDescription);
   // if the image description gives an error, used the country.
   const windSpeed = `Wind Speed: ${result.wind.speed} km/h`;
   const Temperature = result.main.temp;
   const humidity = "Humidity: " + result.main.humidity + "%";
   const weatherIcon = result.weather[0].icon;

   document.querySelector(".city").innerText = "Weather in " + result.name;
   document.querySelector(".temp").innerText = Math.round(Number(Temperature))  + " °C";
   document.querySelector(".description").innerText = weatherDescription;
   document.querySelector(".humidity").innerText = humidity;
   document.querySelector(".wind").innerText = windSpeed;
   document.querySelector(".icon").src = `https://openweathermap.org/img/wn/${weatherIcon}.png`;
   document.querySelector(".weather").classList.remove("loading");
}
   catch(error){
      console.error('GetWeather error =', error);
   }
}


//    let NOInternet = mainBackground.createElement("li");
//    NOInternet.innerText = "No Intrnet"

// }

// window.addEventListener("Offline", ()=>{
//    enterbtn.addEventListener("click", ()=>{
//       console.log("Online")
//    })
// })
GetBackground("Nigeria Landscape");
GetWeather("Nigeria");
