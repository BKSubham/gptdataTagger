"use server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { Threat } from "@/models/threat";

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) return;

    // Log connection attempt
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGODB_URI!);

    // Log success
    console.log("MongoDB connection established successfully.");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error("Database connection failed");
  }
};

// Handle GET Request (Search Query)
export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Utility function to escape special regex characters
    const escapeRegExp = (string: string) => {
      return string.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, "\\$&"); // escape special regex characters
    };
    // Split query into individual words
    const queryWords = query
      .split(" ")
      .map((word) => word.trim().toLowerCase());
    console.log(`Searching for tags: ${queryWords.join(", ")}`); // Log the query words

    // Construct an array of regular expressions for case-insensitive matching of each word
    const regexArray = queryWords.map((word) => new RegExp(word, "i")); // 'i' makes the search case-insensitive

    // Use MongoDB's $or operator to match any of the query words in the tags
    const result = await Threat.find({
      tags: { $elemMatch: { $in: regexArray } }, // Match if any of the tags match the query words
    })
      .sort({ created: -1 }) // Sort by created date in descending order
      .limit(1) // Fetch only top 5 results
      .lean();

    console.log(`MongoDB query executed with result:`, result); // Log the result to verify

    if (!result.length) {
      return NextResponse.json({ answer: "No data found for this query." });
    }

    // Format the response to include matched tag as title and name and description
    const formattedResponse = result.map((item) => ({
      matchedTag: item.tags.find((tag: any) =>
        regexArray.some((regex) => regex.test(tag))
      ),
      name: item.name,
      description: item.description,
    }));
    console.log(formattedResponse);
    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error("Error occurred during the query:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
