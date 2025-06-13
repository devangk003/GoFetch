// Predefined suggested queries for users to quickly select
export const suggestedQueries = [
  "Highest PM2.5 in Harlem last month",
  "NO2 contamination in Upper East Side",
  "Ozone levels in Brooklyn during summer 2022",
  "Air quality comparison between Bronx and Manhattan",
  "Worst air quality days in Queens this year",
  "PM2.5 trends in Lower Manhattan since 2020",
  "Average AQI in Williamsburg",
  "Which neighborhood had the cleanest air last winter?",
];

// Categories of questions users might ask
export const queryCategories = [
  {
    name: "Pollutant Specific",
    examples: [
      "PM2.5 in Central Park",
      "Nitrogen dioxide near schools in Queens",
      "Ozone levels during heatwaves"
    ]
  },
  {
    name: "Location Based",
    examples: [
      "Air quality in Williamsburg",
      "Compare Harlem and Bronx air quality",
      "Cleanest neighborhood in NYC"
    ]
  },
  {
    name: "Time Based",
    examples: [
      "Air quality last summer",
      "PM2.5 trends since 2020",
      "Worst pollution days this year"
    ]
  },
  {
    name: "Health Impact",
    examples: [
      "Most dangerous air days in Brooklyn",
      "Unhealthy AQI in NYC schools",
      "Safe days for outdoor exercise in Manhattan"
    ]
  }
];
