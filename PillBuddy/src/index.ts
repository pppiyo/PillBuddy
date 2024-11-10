//File: example/example-node.ts

import { z } from "zod";
import axios from "axios";

import {
    defineDAINService,
    ToolConfig,
    ServiceConfig,
    ToolboxConfig,
    ServiceContext,
} from "@dainprotocol/service-sdk";

type Pill = {
    name: string;
    color: string;
    shape: string;
    imprint: string;
};

function queryPillDatabase(color: string, shape: string, imprint: string): Pill {
    return {
        name: "dummy",
        color: color,
        shape: shape,
        imprint: imprint
    };
}

const getPillConfig: ToolConfig = {
    id: "get-pill",
    name: "Get Pill",
    description: "Get the pill for a certain patient",
    input: z
        .object({
            color: z.string().describe("color of the pill"),
            shape: z.string().describe("shape of the pill"),
            imprint: z.string().describe("imprint on the pill")
        })
        .describe("Input parameters for the pill request"),
    output: z
        .object({
            name: z.string().describe("name of the pill"),
            color: z.string().describe("color of the pill"),
            shape: z.string().describe("shape of the pill"),
            imprint: z.string().describe("imprint on the pill")
        })
        .describe("Returned pill information"),
    pricing: { pricePerUse: 0, currency: "USD" },
    handler: async ({ color, shape, imprint }, agentInfo) => {
        console.log(
            `User / Agent ${agentInfo.id} requested pill at ${color},${shape},${imprint}`
        );

        const response = queryPillDatabase(color, shape, imprint);


        return {
            text: `The pill this patient is searching for is ${response.name} . Paramaeters given were ${response.color}, ${response.shape}`,
            data: {
                name: response.name,
                color: response.color,
                shape: response.shape,
                imprint: response.imprint,
            },
            ui: {
                // type: "card",
                // uiData: JSON.stringify({ title: "Results" }),
                // children: [
                //     {
                //         type: "table",
                //         uiData: JSON.stringify({ title: "Simple Card" })
                //     }
                // ]
            },
        };
    },
};

// const getWeatherForecastConfig: ToolConfig = {
//     id: "get-weather-forecast",
//     name: "Get Weather Forecast",
//     description: "Fetches hourly weather forecast",
//     input: z
//         .object({
//             latitude: z.number().describe("Latitude coordinate"),
//             longitude: z.number().describe("Longitude coordinate"),
//         })
//         .describe("Input parameters for the forecast request"),
//     output: z
//         .object({
//             times: z.array(z.string()).describe("Forecast times"),
//             temperatures: z
//                 .array(z.number())
//                 .describe("Temperature forecasts in Celsius"),
//             windSpeeds: z.array(z.number()).describe("Wind speed forecasts in km/h"),
//             humidity: z
//                 .array(z.number())
//                 .describe("Relative humidity forecasts in %"),
//         })
//         .describe("Hourly weather forecast"),
//     pricing: { pricePerUse: 0, currency: "USD" },
//     handler: async ({ latitude, longitude }, agentInfo) => {
//         console.log(
//             `User / Agent ${agentInfo.id} requested forecast at ${latitude},${longitude}`
//         );

//         const response = await axios.get(
//             `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m`
//         );

//         const { time, temperature_2m, wind_speed_10m, relative_humidity_2m } =
//             response.data.hourly;

//         return {
//             text: `Weather forecast available for the next ${time.length} hours`,
//             data: {
//                 times: time,
//                 temperatures: temperature_2m,
//                 windSpeeds: wind_speed_10m,
//                 humidity: relative_humidity_2m,
//             },
//             ui: {},
//         };
//     },
// };

const dainService = defineDAINService({
    metadata: {
        title: "Weather DAIN Service",
        description:
            "A DAIN service for current weather and forecasts using Open-Meteo API",
        version: "1.0.0",
        author: "Your Name",
        tags: ["weather", "forecast", "dain"],
        logo: "https://cdn-icons-png.flaticon.com/512/252/252035.png"
    },
    identity: {
        apiKey: process.env.DAIN_API_KEY,
    },
    tools: [getPillConfig],
    // tools: [getPillConfig, getWeatherForecastConfig],
});

dainService.startNode({ port: 2022 }).then(() => {
    console.log("Weather DAIN Service is running on port 2022");
});
