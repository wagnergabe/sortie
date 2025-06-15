import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [sorties, setSorties] = useState([]);
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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

const getDirection = (deg) => {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const adjusted = (deg + 180) % 360; 
  return dirs[Math.round(adjusted / 45) % 8];
};

  const handleFetchWeather = () => {
    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,wind_direction_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;

          const response = await axios.get(url);
          const data = response.data.current;

          const sortie = {
            number: sorties.length + 1,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            temp: Math.round(data.temperature_2m),
            windSpeed: Math.round(data.wind_speed_10m),
            windDir: getDirection(data.wind_direction_10m),
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
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0,
      }
    );
  };

const handleDelete = (index) => {
  const confirmed = window.confirm("Are you sure you want to delete this sortie?");
  if (!confirmed) return;

  const updated = sorties.filter((_, i) => i !== index);
  setSorties(updated);
  localStorage.setItem("sorties", JSON.stringify(updated));
};

  return (
    <div className="p-6 font-sans text-center max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-green-700">Sortie Tracker</h1>

      <button
        onClick={handleFetchWeather}
        className={`${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-700 hover:bg-green-800"
        } text-white px-6 py-2 rounded shadow`}
        disabled={loading}
      >
        {loading ? "Loading..." : "Sortie"}
      </button>

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
                  <td className="p-2 border text-center">
                    <button
                      onClick={() => handleDelete(i)}
                      className="text-red-600 hover:text-red-800"
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
    </div>
  );
}

export default App;
