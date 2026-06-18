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

  const resetSearchState = () => {
    setResults([]);
    setCodigoCount(0);
    setFechaReciente("");
    setSummaryData({});
  };

  const executeSearch = useCallback(async (termNorm) => {
    const criterio = String(termNorm || "").trim();

    setError("");
    setLoading(true);
    resetSearchState();

    if (!criterio) {
      setLoading(false);
      return;
    }

    try {
      const { data, error: rpcError } = await supabase.rpc("buscar_nombres", {
        termino_busqueda: criterio,
      });

      if (rpcError) {
        throw rpcError;
      }

      const safeData = Array.isArray(data) ? data : [];

      // Agrupación por código, respetando el código tal como viene de la BD
      const counts = safeData.reduce((acc, item) => {
        const code = (item.codigo && String(item.codigo).trim()) || "Sin Código";
        acc[code] = (acc[code] || 0) + 1;
        return acc;
      }, {});

      // Ordenar por código para una visualización más estable
      const countsSorted = Object.keys(counts)
        .sort((a, b) => a.localeCompare(b, "es"))
        .reduce((obj, key) => {
          obj[key] = counts[key];
          return obj;
        }, {});

      setSummaryData(countsSorted);

      // Cantidad total de registros encontrados
      setCodigoCount(safeData.length);

      // Fecha de reporte más reciente
      const fechasValidas = safeData
        .map((item) => item.fecha_reporte)
        .filter(Boolean)
        .map((fecha) => new Date(fecha))
        .filter((fecha) => !Number.isNaN(fecha.getTime()));

      if (fechasValidas.length > 0) {
        const fechaMax = new Date(
          Math.max(...fechasValidas.map((fecha) => fecha.getTime()))
        );

        const formateada = fechaMax.toLocaleDateString("es-BO", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        setFechaReciente(formateada);
      }

      setResults(safeData);
    } catch (err) {
      console.error("Error en la búsqueda:", err);

      setError(
        "No se pudo completar la consulta en listas especiales. Verifique el criterio ingresado e inténtelo nuevamente."
      );

      resetSearchState();
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