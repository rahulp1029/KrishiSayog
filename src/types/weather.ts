export interface DailyItem {
    day: string;
    date: string;
    tempMax: number;
    tempMin: number;
    humidity?: number;
    pop: number; // Rain probability %
    precipSum?: number; // mm
    description: string;
    icon: string;
    main?: string;
    windSpeedMax?: number;
    weatherCode?: number;
}

export interface StructuredDailyData {
    date: string[];
    weatherCode: number[];
    temperatureMax: number[];
    temperatureMin: number[];
    precipitationProbabilityMax: number[];
    precipitationSum: number[];
    windSpeedMax: number[];
    description?: string[];
}

export type HybridDailyData = DailyItem[] & StructuredDailyData;

export interface CurrentWeather {
    temp: number;
    temperature?: number;
    feelsLike: number;
    humidity: number;
    precipitation?: number;
    weatherCode: number;
    windSpeed: number;
    windDeg?: number;
    pressure: number;
    visibility: number;
    uvi: number;
    clouds: number;
    description: string;
    icon: string;
    main: string;
}

export interface HourlyForecastItem {
    time: string;
    temp: number;
    humidity: number;
    pop: number;
    description: string;
    icon: string;
}

export interface WeatherData {
    latitude?: number;
    longitude?: number;
    timezone?: string;
    daily: HybridDailyData;
    current: CurrentWeather;
    hourly: HourlyForecastItem[];
    locationName?: string;
    location: string;
    fetchedAt: number | string;
}
