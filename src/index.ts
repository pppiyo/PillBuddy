import { z } from "zod";
import axios from "axios";
import pillDatabase from './pillDatabaseWithImg.json';

import {
    defineDAINService,
    ToolConfig,
    ServiceConfig,
    ToolboxConfig,
    ServiceContext,
} from "@dainprotocol/service-sdk";

interface Pill {
    name: string;
    image_url: string;
    color: string;
    shape: string;
    imprint: string;
    url: string;
}

async function queryPillDatabase(
    color: string,
    shape: string,
    imprint?: string
): Promise<Pill[]> {
    // Find all pills that match the criteria
    const matchingPills = pillDatabase.filter(pill => {
        if (imprint) {
            return pill.color === color && pill.shape === shape && pill.imprint === imprint;
        } else {
            return pill.color === color && pill.shape === shape;
        }
    });

    // Return the matching pills immediately, without retry logic
    if (matchingPills.length > 0) {
        return matchingPills;
    }

    // If no pills were found, return an empty array
    console.error("No matching pills found in the database.");
    return [];
}

const getPillConfig: ToolConfig = {
    id: "pill_buddy",
    name: "Pill Buddy",
    description: "Get the pill for a certain patient",
    input: z
        .object({
            color: z.string().describe("color of the pill"),
            shape: z.string().describe("shape of the pill"),
            imprint: z.string().optional().describe("imprint on the pill, which is optional")
        })
        .describe("Input parameters for the pill request"),
    output: z
        .object({
            name: z.string().describe("name of the pill"),
            image_url: z.string().describe("image of the pill"),
            color: z.string().describe("color of the pill"),
            shape: z.string().describe("shape of the pill"),
            imprint: z.string().describe("imprint on the pill"),
            url: z.string().describe("url of the pill"),
        })
        .array()
        .describe("Returned pill information"),
    pricing: { pricePerUse: 0, currency: "USD" },
    handler: async ({ color, shape, imprint }, agentInfo) => {
        console.log(
            `User / Agent ${agentInfo.id} requested pill at ${color},${shape},${imprint}`
        );

        const response = await queryPillDatabase(color, shape, imprint);

        if (response.length === 0) {
            return {
                text: "No matching pill found in the database.",
                data: null,
                ui: {
                    type: "text",
                    uiData: "No matching pill found."
                }
            };
        }

        // Build rows dynamically based on response data
        try {
            const rows = response.map(pill => ({
                drug: pill.name,
                image: pill.image_url,
                color: pill.color,
                shape: pill.shape,
                imprint: pill.imprint,
                url: {
                    text: "See Details",
                    url: pill.url
                }
            }))

            return {
                text: `Found ${response.length} matching pill(s) based on the provided criteria.`,
                data: response,
                ui: {
                    type: "table",
                    uiData: JSON.stringify({
                        columns: [
                            { key: "drug", header: "Drug(s)", width: "20%" },
                            { key: "image", header: "Image", type: "image", width: "40%" },
                            { key: "color", header: "Color", width: "15%" },
                            { key: "shape", header: "Shape", width: "15%" },
                            { key: "imprint", header: "Imprint", width: "15%" },
                            { key: "url", header: "Link", type: "link", width: "15%" }
                        ],
                        rows: rows
                    })
                },
            };
        }
        catch (error) {
            console.error("Error finding matching pills:", error);
            return {
              text: "Failed to find matching pills",
              data: { error: "Failed to find matching pills" },
              ui: {
                type: "alert",
                uiData: JSON.stringify({
                  type: "error",
                  title: "Error",
                  message: "Failed to find matching pills."
                })
              }
            };
        }
    },
};

const dainService = defineDAINService({
    metadata: {
        title: "Pill Buddy Service",
        description:
            "A DAIN service for pill finding",
        version: "1.0.0",
        author: " Name",
        tags: ["medication", "pill", "AI", "dain"],
        logo: "https://cdn-icons-png.flaticon.com/512/252/252035.png"
    },
    identity: {
        apiKey: process.env.DAIN_API_KEY,
    },
    tools: [getPillConfig],
});

dainService.startNode({ port: 2022 }).then(() => {
    console.log("Pill Buddy DAIN Service is running on port 2022");
});
