import { Tool } from "langchain/tools";

interface GeocodeResponse {
  results: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    elevation: number;
    timezone: string;
    feature_code: string;
    country_code: string;
    country: string;
    country_id: number;
    population: number;
    postcodes: string[];
    admin1: string;
    admin2: string;
    admin3?: string;
    admin4?: string;
    admin1_id: number;
    admin2_id: number;
    admin3_id?: number;
    admin4_id?: number;
  }[];
  generationtime_ms: number;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  uvIndex: number;
  rain: number;
  forecast: Array<{ date: string; temperature: number; rain: number }>;
}

interface GeocodeResponse {
  latitude: number;
  longitude: number;
}

interface WeatherApiResponse {
  current_weather: {
    temperature: number;
    humidity: number;
    uv_index: number;
    precipitation: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
  };
}

export class WeatherTool extends Tool {
  name = "WeatherTool";
  description =
    "Fetches current weather and forecast data from Open Meteo API, use this tool to get weather data.";

  async _call(city: string): Promise<string> {
    console.log(`Fetching geocode data for city: ${city}`);

    // Step 1: Get latitude and longitude from city name using the new geocoding API
    const geocodeResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    const geocodeData = (await geocodeResponse.json()) as GeocodeResponse;
    const { latitude, longitude } = geocodeData.results[0];
    console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);

    // Step 2: Fetch weather data using the obtained latitude and longitude
    console.log(
      `Fetching weather data for coordinates: (${latitude}, ${longitude})`
    );
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Europe/London`
    );
    const weatherData = (await weatherResponse.json()) as WeatherApiResponse;
    console.log(`Weather data received: ${JSON.stringify(weatherData)}`);

    const currentWeather = weatherData.current_weather;
    const dailyForecast = weatherData.daily;

    const weather: WeatherData = {
      temperature: currentWeather.temperature,
      humidity: currentWeather.humidity,
      uvIndex: currentWeather.uv_index,
      rain: currentWeather.precipitation,
      forecast: dailyForecast.time.map((date: string, index: number) => ({
        date,
        temperature: dailyForecast.temperature_2m_max[index],
        rain: dailyForecast.precipitation_sum[index],
      })),
    };

    // Define the format for presenting the data
    const formattedWeather = `
    Current Weather:
    - Temperature: ${weather.temperature}°C
    - Humidity: ${weather.humidity}%
    - UV Index: ${weather.uvIndex}
    - Rain: ${weather.rain}mm
    
    Daily Forecast:
    ${weather.forecast
      .map(
        (day) => `
      Date: ${day.date}
      Max Temperature: ${day.temperature}°C
      Rain: ${day.rain}mm
    `
      )
      .join("\n")}
    `;

    console.log(`Formatted weather data: ${formattedWeather}`);
    return formattedWeather;
  }
}
