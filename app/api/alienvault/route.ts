import { NextResponse } from "next/server";
import axios from "axios";
import { connectDB } from "@/lib/mongodb";
import { Threat } from "@/models/threat";

export async function GET() {
  const API_KEY = process.env.ALIENVAULT_API_KEY;
  const url = "https://otx.alienvault.com/api/v1/pulses/subscribed?page=1";

  if (!API_KEY) {
    return NextResponse.json({ error: "API key is missing!" }, { status: 400 });
  }

  try {
    await connectDB();

    const response = await axios.get(url, {
      headers: { "X-OTX-API-KEY": API_KEY },
    });

    if (response.status !== 200) {
      throw new Error(`AlienVault API Error: ${response.statusText}`);
    }

    const threatData = response.data.results.map((item: any) => ({
      name: item.name,
      description: item.description,
      tags: item.tags || [],
      created_at: new Date(item.modified),
    }));

    await Threat.insertMany(threatData);

    return NextResponse.json({
      message: "Data saved successfully!",
      threats: threatData,
    });
  } catch (error: any) {
    console.error("Error fetching AlienVault data:", error);
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
