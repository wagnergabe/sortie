import React, { useState, useEffect } from "react";
import axios from "axios";
import mmcd from '../public/mmcd.jpg';


function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false); // ✅ start hidden

  const [sorties, setSorties] = useState([]);
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);

  useEffect(() => {
  const handler = (e) => {
    console.log("✅ beforeinstallprompt fired");
    e.preventDefault();
    setDeferredPrompt(e);
    setShowInstallBtn(true);
  };

  window.addEventListener("beforeinstallprompt", handler);
  return () => window.removeEventListener("beforeinstallprompt", handler);
}, []);


  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("sorties")) || [];
    const savedDate = localStorage.getItem("sortieDate");
    const today = new Date().toDateString();

    if (savedDate === today) {
      setSorties(saved);
    } else {
      localStorage.removeItem("sorties");
      localStorage.setItem("sortieDate", today);
    }
  }, []);

  // ✅ PWA install button setup
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const getDirection = (deg) => {
    const adjustedDeg = (deg + 180) % 360;

    if (adjustedDeg >= 337.5 || adjustedDeg < 22.5) return "N";
    if (adjustedDeg >= 22.5 && adjustedDeg < 67.5) return "NE";
    if (adjustedDeg >= 67.5 && adjustedDeg < 112.5) return "E";
    if (adjustedDeg >= 112.5 && adjustedDeg < 157.5) return "SE";
    if (adjustedDeg >= 157.5 && adjustedDeg < 202.5) return "S";
    if (adjustedDeg >= 202.5 && adjustedDeg < 247.5) return "SW";
    if (adjustedDeg >= 247.5 && adjustedDeg < 292.5) return "W";
    if (adjustedDeg >= 292.5 && adjustedDeg < 337.5) return "NW";
    return "?";
  };

  const handleFetchWeather = () => {
    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        try {
          const url = `https://api.weatherapi.com/v1/current.json?key=d515a082e2d74d11a03160416251506&q=${latitude},${longitude}&aqi=no`;

          const response = await axios.get(url);
          const data = response.data;

          const sortie = {
            number: sorties.length + 1,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            temp: Math.round(data.current.temp_f),
            windSpeed: Math.floor(data.current.wind_mph),
            windDir: getDirection(data.current.wind_degree),
            lat: latitude.toFixed(4),
            lon: longitude.toFixed(4),
          };

          const updated = [...sorties, sortie];
          setSorties(updated);
          setWeather(sortie);
          localStorage.setItem("sorties", JSON.stringify(updated));
          localStorage.setItem("sortieDate", new Date().toDateString());
        } catch (err) {
          console.error(err);
          setError("Failed to fetch weather.");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error(err);
        setError("Failed to get location.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleSortieOnly = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        const sortie = {
          number: sorties.length + 1,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          temp: "-",
          windSpeed: "-",
          windDir: "-",
          lat: latitude.toFixed(4),
          lon: longitude.toFixed(4),
        };

        const updated = [...sorties, sortie];
        setSorties(updated);
        setWeather(null);
        localStorage.setItem("sorties", JSON.stringify(updated));
        localStorage.setItem("sortieDate", new Date().toDateString());
      },
      (err) => {
        console.error(err);
        setError("Failed to get location.");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleDelete = (index) => {
    const updated = sorties.filter((_, i) => i !== index);
    setSorties(updated);
    setPendingDeleteIndex(null);
    localStorage.setItem("sorties", JSON.stringify(updated));
  };

  return (
    <div className="p-6 font-sans text-center max-w-4xl mx-auto">
     <img className="mb-3" src="/mmcd.jpg" alt="App banner" />

      <h1 className="text-3xl font-bold mb-4 text-green-700">Sortie Tracker</h1>
      <h2>Test Application</h2>

      <button
        onClick={handleFetchWeather}
        className={`${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-700 hover:bg-green-800"
        } text-white px-6 py-2 rounded shadow`}
        disabled={loading}
      >
        {loading ? "Loading..." : "Sortie"}
      </button>

      <button
        onClick={handleSortieOnly}
        className="ml-4 bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-2 rounded shadow"
      >
        Log
      </button>

   {/* ✅ Show download app link if ready */}
{showInstallBtn && deferredPrompt && (
  <p className="mt-4 text-sm text-blue-700 underline cursor-pointer hover:text-blue-900"
     onClick={async () => {
       deferredPrompt.prompt();
       const result = await deferredPrompt.userChoice;

       if (result.outcome === "accepted") {
         console.log("✅ App installed");
       } else {
         console.log("❌ Install dismissed");
       }

       setDeferredPrompt(null);
       setShowInstallBtn(false);
     }}
  >
    📲 Download App (testing in progress)
  </p>
)}


      {error && <p className="text-red-500 mt-4">{error}</p>}

      {weather && (
        <div className="mt-6 grid grid-cols-2 gap-4 text-center text-2xl font-semibold">
          <div className="bg-amber-100 p-4 rounded shadow">
            <p className="text-green-700 text-sm">Temperature</p>
            <p>{weather.temp}°F</p>
          </div>
          <div className="bg-amber-100 p-4 rounded shadow">
            <p className="text-green-700 text-sm">Sortie #</p>
            <p>{weather.number}</p>
          </div>
          <div className="bg-amber-100 p-4 rounded shadow">
            <p className="text-green-700 text-sm">Wind Speed</p>
            <p>{weather.windSpeed} mph</p>
          </div>
          <div className="bg-amber-100 p-4 rounded shadow">
            <p className="text-green-700 text-sm">Wind Direction</p>
            <p>{weather.windDir}</p>
          </div>
        </div>
      )}

      {sorties.length > 0 && (
        <div className="mt-10 overflow-x-auto">
          <h2 className="text-xl font-semibold mb-2 text-green-700">Today's Sorties</h2>
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-green-700 text-white">
                <th className="p-2 border">#</th>
                <th className="p-2 border">Time</th>
                <th className="p-2 border">Temp (°F)</th>
                <th className="p-2 border">Wind</th>
                <th className="p-2 border">Dir</th>
                <th className="p-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {sorties.map((s, i) => (
                <tr key={i} className="odd:bg-white even:bg-amber-100/60">
                  <td className="p-2 border">{s.number}</td>
                  <td className="p-2 border">{s.time}</td>
                  <td className="p-2 border">{s.temp}</td>
                  <td className="p-2 border">{s.windSpeed} mph</td>
                  <td className="p-2 border">{s.windDir}</td>
                  <td className="p-2 border text-center w-16">
                    <button
                      onClick={() => setPendingDeleteIndex(i)}
                      className="text-red-600 hover:text-red-800 transition duration-200 transform hover:scale-110"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pendingDeleteIndex !== null && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] max-w-sm bg-white border border-gray-300 shadow-lg rounded-lg px-4 py-4 z-50 animate-fade-in flex flex-col items-center text-center space-y-3">
          <p className="text-sm text-gray-700">
            Confirm deletion of sortie #{sorties[pendingDeleteIndex].number}?
          </p>
          <div className="flex justify-between gap-4 w-full">
            <button
              onClick={() => handleDelete(pendingDeleteIndex)}
              className="bg-red-600 text-white flex-1 py-2 rounded hover:bg-red-700 text-sm"
            >
              Confirm
            </button>
            <button
              onClick={() => setPendingDeleteIndex(null)}
              className="bg-gray-200 text-gray-700 flex-1 py-2 rounded hover:bg-gray-300 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <footer className="mt-12 text-center text-xs text-gray-500">
        App created by Gabriel Wagner (2717)
      </footer>
    </div>
  );
}

export default App;
