import React, { useState, useCallback } from 'react';
import axios from 'axios';
import './App.css';

// Import Google Fonts
const style = document.createElement('style');
style.textContent = `@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');`;
document.head.appendChild(style);

function App() {
  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const apiKey = 'yLhLRbuOn55ycWWyeEAA0GzTkmFWTyk9'; // Should be in .env

  const fetchWeatherByCity = useCallback(async (e) => {
    e.preventDefault();
    if (!city.trim()) {
      setError('Please enter a city name');
      return;
    }
    fetchWeather(`http://dataservice.accuweather.com/locations/v1/cities/search?apikey=${apiKey}&q=${encodeURIComponent(city)}`);
  }, [city]);

  const fetchWeatherByCoords = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    setError('');
    setWeatherData(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await fetchWeather(
          `http://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${apiKey}&q=${latitude},${longitude}`
        );
      },
      (err) => {
        setError('Unable to retrieve your location. Please allow location access.');
        setIsLoading(false);
        console.error(err);
      }
    );
  }, []);

  const fetchWeather = async (locationUrl) => {
    setIsLoading(true);
    setError('');
    setWeatherData(null);

    try {
      const locationResponse = await axios.get(locationUrl);
      const location = locationResponse.data[0] || locationResponse.data; // Handle both city search and geoposition responses
      if (!location) throw new Error('Location not found');

      const forecastResponse = await axios.get(
        `http://dataservice.accuweather.com/forecasts/v1/daily/1day/${location.Key}?apikey=${apiKey}&metric=true`
      );
      
      const forecast = forecastResponse.data.DailyForecasts[0];
      
      setWeatherData({
        city: location.LocalizedName,
        state: location.AdministrativeArea?.LocalizedName || '', // Add state/administrative area
        country: location.Country.LocalizedName,
        temperature: forecast.Temperature.Maximum.Value,
        weatherText: forecast.Day.IconPhrase,
        date: forecast.Date,
        minTemp: forecast.Temperature.Minimum.Value,
        precipitation: forecast.Day.HasPrecipitation ? 'Yes' : 'No',
        unit: '°C' // Hardcode to Celsius
      });
    } catch (err) {
      setError(err.message || 'Error fetching weather data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getWeatherIcon = (weatherText) => {
    const icons = {
      'sunny': '☀️',
      'mostly sunny': '☀️',
      'partly sunny': '⛅',
      'cloudy': '☁️',
      'mostly cloudy': '☁️',
      'partly cloudy': '⛅',
      'rain': '🌧️',
      'showers': '🌧️',
      'thunderstorms': '⛈️',
      'snow': '❄️',
      'fog': '🌫️',
      'windy': '💨'
    };
    return icons[weatherText.toLowerCase()] || '🌡️';
  };

  return (
    <div className="app">
      <div className="header">
        <div className="header-content">
          <span className="header-icon">⛅</span>
          <h1>Weather Forecast</h1>
        </div>
      </div>

      <div className="content">
        <button
          className="locate-me"
          onClick={fetchWeatherByCoords}
          disabled={isLoading}
          style={{
            margin: '0.5rem 0',
            background: 'transparent',
            border: '2px solid var(--accent-color)',
            padding: '0.5rem 1rem',
            color: 'var(--accent-color)',
            borderRadius: '12px',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          {isLoading ? (
            <span>
              <span className="loading-spinner">⏳</span> Locating...
            </span>
          ) : (
            'Locate Me'
          )}
        </button>

        <form onSubmit={fetchWeatherByCity}>
          <input
            type="text"
            placeholder="Enter city name"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? (
              <span>
                <span className="loading-spinner">⏳</span> Loading...
              </span>
            ) : (
              'Get Weather'
            )}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        {weatherData && (
          <div className="weather-info" key={weatherData.date}>
            <h2>
              {weatherData.city}
              {weatherData.state ? `, ${weatherData.state}` : ''}, {weatherData.country}
            </h2>
            <p className="date">
              {new Date(weatherData.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>

            <div className="weather-main">
              <span className="weather-icon">
                {getWeatherIcon(weatherData.weatherText)}
              </span>
              <div>
                <p className="temperature">
                  {Math.round(weatherData.temperature)}{weatherData.unit}
                </p>
                <p className="condition">{weatherData.weatherText}</p>
              </div>
            </div>

            <div className="weather-details">
              <div className="detail-item">
                <span>Min Temp</span>
                <span>{Math.round(weatherData.minTemp)}{weatherData.unit}</span>
              </div>
              <div className="detail-item">
                <span>Precipitation</span>
                <span>{weatherData.precipitation}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;