// src/hooks/useGlobalSummary.js
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export function useGlobalSummary() {
  const [globalSummary, setGlobalSummary] = useState([]);
  const [globalTotal, setGlobalTotal] = useState(0);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [globalError, setGlobalError] = useState(null);
  const [globalLastUpdateDate, setGlobalLastUpdateDate] = useState(""); // ✅ Nuevo estado para la fecha global

  useEffect(() => {
    const fetchGlobalData = async () => {
      setGlobalLoading(true);
      setGlobalError(null);
      try {
        // ✅ Llamada a la función RPC para el resumen por código
        const { data: summaryData, error: summaryError } = await supabase.rpc(
          "obtener_resumen_global_por_codigo"
        );

        if (summaryError) {
          throw summaryError;
        }

        if (summaryData) {
          setGlobalSummary(summaryData);
          const total = summaryData.reduce((sum, item) => sum + item.count, 0);
          setGlobalTotal(total);
        }

        // ✅ Llamada a la nueva función RPC para la última fecha de reporte global
        const { data: dateData, error: dateError } = await supabase.rpc(
          "obtener_ultima_fecha_reporte_global"
        );

        if (dateError) {
          throw dateError;
        }

        // Si dateData no es nulo, lo establecemos
        if (dateData) {
          setGlobalLastUpdateDate(dateData);
        } else {
          setGlobalLastUpdateDate("No disponible");
        }
      } catch (err) {
        console.error("Error al obtener datos globales:", err);
        setGlobalError(
          "No se pudieron cargar los datos globales. Inténtelo de nuevo más tarde."
        );
      } finally {
        setGlobalLoading(false);
      }
    };

    fetchGlobalData();
  }, []); // Se ejecuta solo una vez al montar el componente

  // ✅ Retornamos también globalLastUpdateDate
  return { globalSummary, globalTotal, globalLoading, globalError, globalLastUpdateDate };
}