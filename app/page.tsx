"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FaArrowUp } from "react-icons/fa";

export default function Home() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [searchResponse, setSearchResponse] = useState(""); // Response for search input
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const handleSearch = async (
    searchQuery: string,
    isQuestion: boolean = false
  ) => {
    if (!searchQuery) return;
    if (isQuestion) {
      setLoading(true);
      setResponse(""); // Reset previous response
    } else {
      setSearchLoading(true);
      setSearchResponse(""); // Reset search response
    }
    setQuery(searchQuery); // Update input field

    try {
      console.log("Making API call with query:", searchQuery);
      const res = await fetch(
        `/api/search?query=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();
      console.log("API response data:", data);

      // Check for error in the response
      if (data.error) {
        throw new Error(data.error); // If there's an error message, throw it
      }
      // Format and render the data into UI components
      const formattedResponse = data.map((item: any) => (
        <Card key={item.matchedTag} className="mb-4 shadow-md">
          <CardHeader>
            <h1 className="text-xl font-semibold">{item.name}</h1>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{item.description}</p>
            <p className="text-gray-500">Matched Tag: {item.matchedTag}</p>
          </CardContent>
        </Card>
      ));

      if (isQuestion) {
        setResponse(formattedResponse);
      } else {
        setSearchResponse(formattedResponse);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      if (isQuestion) {
        setResponse("No data found for this query.");
      } else {
        setSearchResponse("No data found for this query.");
      }
    } finally {
      if (isQuestion) {
        setLoading(false);
      } else {
        setSearchLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <header className="w-full flex justify-between items-center p-4 bg-gray-800 text-white rounded-lg shadow-md">
        <h1 className="text-xl font-bold">Cyber Threat Data</h1>
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </header>

      {/* Quick Questions - Cards as Buttons */}
      <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {[
          "Ransomware Timeline?",
          "Recent Cyber Threat?",
          "Volt Typhoon Attack Vector?",
          "Common CVE Impact?",
        ].map((question, index) => (
          <Card
            key={index}
            className="cursor-pointer shadow-md transition transform hover:scale-105 hover:shadow-lg"
            onClick={() => handleSearch(question)}
          >
            <CardContent className="p-4 text-center font-medium text-gray-700">
              {question}
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Search Bar Card */}
      <Card className="w-full max-w-3xl mt-6 shadow-md">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-center mb-4">
            Search Cyber Threats
          </h2>
          <div className="relative flex items-center">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about cyber threats..."
              className="w-full h-16 pr-16 text-lg border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg"
            />
            <button
              onClick={() => handleSearch(query)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-10 h-10 bg-black text-white rounded-full hover:bg-gray-800 transition"
            >
              <FaArrowUp className="text-white" />
            </button>
          </div>
        </CardContent>
      </Card>
      {/* Response for Search Query (Below Search Bar) */}
      {searchResponse && (
        <Card className="w-full max-w-3xl mt-4 shadow-md bg-white border-l-4 border-blue-500">
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold">Answer:</h2>
            {searchLoading ? (
              <p className="text-gray-600">Loading...</p>
            ) : (
              <div className="mt-4">{searchResponse}</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
