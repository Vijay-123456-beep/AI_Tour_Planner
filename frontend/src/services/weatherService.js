import axios from 'axios';
import apiClient from './api';

const API_KEY = 'fc720f77b2adc6ea259934f20928688b';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/forecast';

export const fetchWeatherForecast = async (destination, startDate, endDate, interests = []) => {
    try {
        // Fetch 5-day forecast from OpenWeatherMap
        const response = await axios.get(BASE_URL, {
            params: {
                q: destination,
                appid: API_KEY,
                units: 'metric'
            }
        });

        const list = response.data.list;
        const city = response.data.city;

        // Process 3-hour intervals into daily forecast
        // We take the forecast for 12:00 PM each day as representative
        const dailyForecasts = {};

        list.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            const time = item.dt_txt.split(' ')[1];

            // Prefer 12:00:00, or take the first one if not set
            if (!dailyForecasts[date] || time === '12:00:00') {
                dailyForecasts[date] = {
                    date: date,
                    temp: Math.round(item.main.temp),
                    condition: item.weather[0].main,
                    description: item.weather[0].description,
                    humidity: item.main.humidity,
                    windSpeed: Math.round(item.wind.speed * 3.6), // m/s to km/h
                    precipitation: Math.round((item.pop || 0) * 100),
                    icon: item.weather[0].icon
                };
            }
        });

        const forecast = Object.values(dailyForecasts).slice(0, 5); // Limit to 5 days
        const avgTemp = forecast.reduce((sum, day) => sum + day.temp, 0) / (forecast.length || 1);

        return {
            destination: city.name,
            startDate, // Note: Forecast is only next 5 days, might not match trip dates exactly
            endDate,
            forecast,
            summary: {
                avgTemp: Math.round(avgTemp),
                condition: forecast[0]?.condition || 'Unknown',
                precipitation: `${Math.max(...forecast.map(d => d.precipitation))}%`,
                windSpeed: `${Math.round(forecast.reduce((sum, d) => sum + d.windSpeed, 0) / forecast.length)} km/h`
            },
            packingRecommendations: getWeatherRecommendations(forecast)
        };

    } catch (error) {
        console.warn('Real weather fetch failed, falling back to mock:', error);
        return generateMockWeatherData(destination, startDate, endDate);
    }
};

const generateMockWeatherData = (destination, startDate, endDate) => {
    const forecast = generateMockForecast(startDate, endDate);
    const avgTemp = forecast.reduce((sum, day) => sum + day.temp, 0) / forecast.length;

    return {
        destination,
        startDate,
        endDate,
        forecast,
        summary: {
            avgTemp: Math.round(avgTemp),
            condition: 'Partly Cloudy',
            precipitation: '20%',
            windSpeed: '10 km/h'
        },
        packingRecommendations: getWeatherRecommendations(forecast)
    };
};

const generateMockForecast = (startDate, endDate) => {
    const forecast = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy', 'Overcast'];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        forecast.push({
            date: new Date(d).toISOString().split('T')[0],
            temp: Math.floor(Math.random() * 15 + 20), // 20-35°C
            condition: conditions[Math.floor(Math.random() * conditions.length)],
            humidity: Math.floor(Math.random() * 40 + 40), // 40-80%
            windSpeed: Math.floor(Math.random() * 20 + 5), // 5-25 km/h
            precipitation: Math.floor(Math.random() * 100) // 0-100%
        });
    }

    return forecast;
};

export const getWeatherRecommendations = (forecast) => {
    const recommendations = [];

    forecast.forEach(day => {
        if (day.condition === 'Rainy' || day.precipitation > 60) {
            recommendations.push(`${day.date}: Carry umbrella and waterproof bag`);
        }
        if (day.temp > 30) {
            recommendations.push(`${day.date}: Use sunscreen and stay hydrated`);
        }
        if (day.windSpeed > 20) {
            recommendations.push(`${day.date}: Secure loose items, windy conditions`);
        }
    });

    return recommendations;
};

export const getHealthTips = async (destination, startDate, endDate) => {
    try {
        const response = await apiClient.post('/weather/health-tips', {
            destination,
            start_date: startDate,
            end_date: endDate
        });
        return response.data.data;
    } catch (error) {
        console.error('Error fetching health tips:', error);
        return {};
    }
};
