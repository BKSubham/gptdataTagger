"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [threats, setThreats] = useState([]);

  useEffect(() => {
    fetch("/api/alienvault")
      .then((res) => res.json())
      .then((data) => setThreats(data.results || []));
  }, []);

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">Cyber Threat Data</h1>
      <ul className="mt-4">
        {threats.map((threat: any, index: number) => (
          <li key={index} className="p-2 border-b">
            <h2 className="text-xl">{threat.name}</h2>
            <p>{threat.description}</p>
            <p className="text-gray-500">{threat.tags.join(", ")}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
