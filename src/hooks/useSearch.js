// src/hooks/useSearch.js
import { useState, useCallback } from "react";
import { supabase } from "../supabaseClient";

export function useSearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [codigoCount, setCodigoCount] = useState(0);
  const [fechaReciente, setFechaReciente] = useState("");
  const [summaryData, setSummaryData] = useState({});

  const executeSearch = useCallback(async (termNorm) => {
    setError("");
    setLoading(true);
    setResults([]);
    setCodigoCount(0);
    setFechaReciente("");
    setSummaryData({});

    if (!termNorm) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc("buscar_nombres", {
        termino_busqueda: termNorm,
      });

      if (error) throw error;

      // ✅ Ahora data incluye CampoCoincidencia y Relevancia
      // Ya viene ordenado por relevancia (ASC)

      // Cálculo de resumen por Código
      const counts = data.reduce((acc, item) => {
        const code = item.Codigo || "Sin Código";
        acc[code] = (acc[code] || 0) + 1;
        return acc;
      }, {});
      setSummaryData(counts);

      // Cantidad total de registros encontrados
      setCodigoCount(data.length);

      // Fecha más reciente
      const fechas = data
        .map((item) => item.FechaReporte)
        .filter(Boolean)
        .map((fecha) => new Date(fecha));

      if (fechas.length > 0) {
        const fechaMax = new Date(Math.max(...fechas));
        const formateada = fechaMax.toLocaleDateString("es-BO", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        setFechaReciente(formateada);
      }

      setResults(data);
    } catch (err) {
      console.error("Error en la búsqueda:", err);
      setError("Error al buscar datos. Inténtelo de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    results,
    loading,
    error,
    codigoCount,
    fechaReciente,
    summaryData,
    executeSearch,
  };
}
