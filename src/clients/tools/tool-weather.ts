// src/clients/tools/tool-weather.ts

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

interface WeatherApiResponse {
  current: {
    time: string;
    interval: number;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    apparent_temperature_max: number[];
    apparent_temperature_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    precipitation_sum: number[];
    precipitation_hours: number[];
    precipitation_probability_max: number[];
  };
}

interface WeatherData {
  current: {
    temperature: number;
    humidity: number;
    apparentTemperature: number;
    precipitation: number;
  };
  today: {
    temperatureMax: number;
    temperatureMin: number;
    apparentTemperatureMax: number;
    apparentTemperatureMin: number;
    sunrise: string;
    sunset: string;
    uvIndexMax: number;
    precipitationSum: number;
    precipitationHours: number;
    precipitationProbabilityMax: number;
  };
  forecast: Array<{
    date: string;
    temperatureMax: number;
    temperatureMin: number;
    apparentTemperatureMax: number;
    apparentTemperatureMin: number;
    sunrise: string;
    sunset: string;
    uvIndexMax: number;
    precipitationSum: number;
    precipitationHours: number;
    precipitationProbabilityMax: number;
  }>;
}

export class WeatherTool extends Tool {
  name = "WeatherTool";
  description =
    "Fetches current weather and forecast data from Open Meteo API, use this tool to get weather data.";

  async _call(city: string): Promise<string> {
    const geocodeResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    const geocodeData = (await geocodeResponse.json()) as GeocodeResponse;
    const { latitude, longitude, timezone, name, admin1, country } =
      geocodeData.results[0];

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_hours,precipitation_probability_max&timezone=${encodeURIComponent(timezone)}`
    );
    const weatherData = (await weatherResponse.json()) as WeatherApiResponse;

    const weather: WeatherData = {
      current: {
        temperature: weatherData.current.temperature_2m,
        humidity: weatherData.current.relative_humidity_2m,
        apparentTemperature: weatherData.current.apparent_temperature,
        precipitation: weatherData.current.precipitation,
      },
      today: {
        temperatureMax: weatherData.daily.temperature_2m_max[0],
        temperatureMin: weatherData.daily.temperature_2m_min[0],
        apparentTemperatureMax: weatherData.daily.apparent_temperature_max[0],
        apparentTemperatureMin: weatherData.daily.apparent_temperature_min[0],
        sunrise: weatherData.daily.sunrise[0],
        sunset: weatherData.daily.sunset[0],
        uvIndexMax: weatherData.daily.uv_index_max[0],
        precipitationSum: weatherData.daily.precipitation_sum[0],
        precipitationHours: weatherData.daily.precipitation_hours[0],
        precipitationProbabilityMax:
          weatherData.daily.precipitation_probability_max[0],
      },
      forecast: weatherData.daily.time.slice(1, 7).map((date, index) => ({
        date,
        temperatureMax: weatherData.daily.temperature_2m_max[index + 1],
        temperatureMin: weatherData.daily.temperature_2m_min[index + 1],
        apparentTemperatureMax:
          weatherData.daily.apparent_temperature_max[index + 1],
        apparentTemperatureMin:
          weatherData.daily.apparent_temperature_min[index + 1],
        sunrise: weatherData.daily.sunrise[index + 1],
        sunset: weatherData.daily.sunset[index + 1],
        uvIndexMax: weatherData.daily.uv_index_max[index + 1],
        precipitationSum: weatherData.daily.precipitation_sum[index + 1],
        precipitationHours: weatherData.daily.precipitation_hours[index + 1],
        precipitationProbabilityMax:
          weatherData.daily.precipitation_probability_max[index + 1],
      })),
    };

    const formattedWeather = `
    Weather for ${name}, ${admin1}, ${country} 

    Current Weather:
    - Temperature: ${weather.current.temperature}°C
    - Apparent Temperature: ${weather.current.apparentTemperature}°C
    - Max Temperature: ${weather.today.temperatureMax}°C
    - Min Temperature: ${weather.today.temperatureMin}°C
    - Humidity: ${weather.current.humidity}%
    - Max Precipitation Probability for Today: ${weather.today.precipitationProbabilityMax}%
    - Precipitation for Today: ${weather.today.precipitationSum}mm
    - Max UV Index for Today: ${weather.today.uvIndexMax}

    Forecast for Tomorrow:
    ${weather.forecast
      .slice(0, 1)
      .map(
        (day) => `
    - Date: ${day.date}
    - Max Temperature: ${day.temperatureMax}°C
    - Min Temperature: ${day.temperatureMin}°C
    - Sunrise: ${day.sunrise}
    - Sunset: ${day.sunset}
    - UV Index: ${day.uvIndexMax}
    - Precipitation Sum: ${day.precipitationSum}mm
    - Precipitation Hours: ${day.precipitationHours}h
    - Max Precipitation Probability: ${day.precipitationProbabilityMax}%
    `
      )
      .join("\n")}
    `;

    return formattedWeather;
  }
}
