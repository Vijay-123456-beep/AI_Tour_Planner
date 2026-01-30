import api from './api';

export const fetchWeatherForecast = async (destination, startDate, endDate, interests = []) => {
    try {
        // Call backend API first
        try {
            const interestsParam = interests.join(',');
            const response = await api.get('/weather/forecast', {
                params: {
                    destination,
                    start_date: startDate,
                    end_date: endDate,
                    interests: interestsParam
                }
            });
            return response.data.data;
        } catch (apiError) {
            console.warn('Backend API error, falling back to mock data:', apiError);
            // Fallback to mock data if API fails
            return generateMockWeatherData(destination, startDate, endDate);
        }
    } catch (error) {
        console.error('Weather fetch error:', error);
        throw error;
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
        const response = await api.post('/weather/health-tips', {
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
