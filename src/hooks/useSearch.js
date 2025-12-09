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

      // ✅ MEJORADO: Agrupación correcta por código
      const counts = data.reduce((acc, item) => {
        // Tomar el código tal como viene de la BD (sin transformación)
        const code = (item.codigo && item.codigo.trim()) || "Sin Código";
        acc[code] = (acc[code] || 0) + 1;
        return acc;
      }, {});
      
      // ✅ MEJORADO: Ordenar por código para mejor visualización
      const countsSorted = Object.keys(counts)
        .sort()
        .reduce((obj, key) => {
          obj[key] = counts[key];
          return obj;
        }, {});
      
      setSummaryData(countsSorted);

      // Cantidad total de registros encontrados
      setCodigoCount(data.length);

      // Fecha más reciente
      const fechas = data
        .map((item) => item.fecha_reporte)
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
      
      // ✅ DEBUGGER: Verifica qué estás recibiendo
      console.log("📊 Resumen por código:", countsSorted);
      console.log("📋 Resultados:", data);
      
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