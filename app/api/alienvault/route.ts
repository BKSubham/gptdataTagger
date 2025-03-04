import { NextResponse } from "next/server";
import axios from "axios";
import { connectDB } from "@/lib/mongodb";
import { Threat } from "@/models/threat";

// Fetch threat data from AlienVault OTX and save it to MongoDB
export async function GET() {
  const API_KEY = process.env.ALIENVAULT_API_KEY;
  const url = "https://otx.alienvault.com/api/v1/pulses/subscribed?page=1";

  if (!API_KEY) {
    return NextResponse.json({ error: "API key is missing!" }, { status: 400 });
  }

  try {
    await connectDB(); // Connect to MongoDB

    // Fetch threat data from AlienVault OTX API
    const response = await axios.get(url, {
      headers: { "X-OTX-API-KEY": API_KEY },
    });

    if (response.status !== 200) {
      throw new Error(`AlienVault API Error: ${response.statusText}`);
    }

    // Map the response data into the format for MongoDB
    const threatData = response.data.results.map((item: any) => ({
      name: item.name,
      description: item.description,
      tags: item.tags || [],
      created_at: new Date(item.modified),
    }));

    // Save data to MongoDB
    await Threat.insertMany(threatData);

    // Return the data that was saved
    return NextResponse.json({
      message: "Data saved successfully!",
      threats: threatData,
    });
  } catch (error: any) {
    //console.error("Error fetching AlienVault data:", error);
    return NextResponse.json(
      {
        error:
          error.response?.data?.error ||
          error.message ||
          "Failed to fetch data",
      },
      { status: error.response?.status || 500 }
    );
  }
}

// Fetch relevant threats from MongoDB based on query
async function getThreatsBasedOnQuery(query: string) {
  try {
    await connectDB();

    // Trim and lowercase the query to ensure proper matching
    const keywords = query.trim().toLowerCase();

    // Fetch matching threats by tags using regular expressions
    const matchingThreats = await Threat.find({
      tags: { $elemMatch: { $regex: new RegExp(keywords, "i") } },
    })
      .sort({ created_at: -1 }) // Sort by 'created_at' in descending order (most recent)
      .limit(5); // Limit the results to avoid excessive data
    console.log("Fetched Threats:", matchingThreats);

    return matchingThreats;
  } catch (error) {
    console.error("Error retrieving threats from MongoDB:", error);
    return [];
  }
}

// AI Response generation using Hugging Face's API
async function getAIResponse(query: string, context: string) {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/gpt2",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
      },
      body: JSON.stringify({
        inputs: `OUTPUT from the huggingface AI model.\n\n${context}\n\nUser Query: ${query}`,
        parameters: {
          max_length: 100,
          temperature: 0.7,
          top_p: 0.9,
          top_k: 50,
        },
      }),
    }
  );

  const data = await response.json();
  console.log("Hugging Face API Response:", data);

  // Check if the response contains generated text
  if (data && data[0]?.generated_text) {
    return data[0].generated_text || "Unable to generate response.";
  } else {
    console.error("Hugging Face Error: Generated text not found.");
    return "Sorry, I couldn't process your request.";
  }
}

// Main handler for processing queries and fetching AlienVault data
export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    console.log("Received query:", query);

    // Step 2: Get relevant threats based on the query's tags
    const relevantThreats = await getThreatsBasedOnQuery(query);

    if (relevantThreats.length === 0) {
      return NextResponse.json({ answer: "No relevant data found." });
    }

    // Step 3: Prepare context for the AI model
    const context = relevantThreats
      .map((threat, index: number) => {
        return `Threat ${index + 1}
        Threat Name: ${threat.name}\nDescription: ${
          threat.description
        }\nTags: ${threat.tags.join(", ")}\n`;
      })
      .join("\n\n");

    // Step 4: Get AI response using the context
    const aiResponse = await getAIResponse(query, context);
    // Format the AI response into bullet points or sections

    return NextResponse.json({ answer: aiResponse });
  } catch (error) {
    console.error("Error in analysis API:", error);
    return NextResponse.json({ error: "Something went wrong." });
  }
}
