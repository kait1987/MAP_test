"use client";

import { useEffect, useState, useRef } from "react";

export default function DebugMapPage() {
  const [status, setStatus] = useState<string[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => setStatus((prev) => [...prev, msg]);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
    addLog(`Environment Variable Check:`);
    addLog(`NEXT_PUBLIC_NAVER_MAP_CLIENT_ID: ${clientId ? clientId.substring(0, 3) + "****" + clientId.substring(clientId.length - 3) : "UNDEFINED"}`);
    addLog(`Length: ${clientId ? clientId.length : 0}`);

    if (!clientId) {
      addLog("ERROR: Client ID is missing!");
      return;
    }

    addLog("Loading Script...");
    const script = document.createElement("script");
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    script.async = true;
    script.onload = () => {
      addLog("Script Loaded Successfully.");
      if (window.naver && window.naver.maps) {
        addLog("window.naver.maps is available.");
        try {
          if (mapRef.current) {
            new window.naver.maps.Map(mapRef.current, {
              center: new window.naver.maps.LatLng(37.5665, 126.9780),
              zoom: 10,
            });
            addLog("Map Initialized Successfully.");
          } else {
            addLog("ERROR: Map container ref is null.");
          }
        } catch (e: any) {
          addLog(`ERROR Initializing Map: ${e.message}`);
        }
      } else {
        addLog("ERROR: window.naver.maps is undefined after load.");
      }
    };
    script.onerror = () => {
      addLog("ERROR: Script Load Failed.");
    };
    document.head.appendChild(script);

    return () => {
      // cleanup
    };
  }, []);

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">Naver Map Debug</h1>
      <div id="debug-logs" className="mb-4 p-4 bg-gray-100 rounded border">
        <h2 className="font-bold">Logs:</h2>
        {status.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
      <div ref={mapRef} style={{ width: "100%", height: "400px", border: "1px solid red" }}></div>
    </div>
  );
}
