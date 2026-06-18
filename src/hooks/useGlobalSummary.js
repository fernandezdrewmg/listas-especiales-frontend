// src/hooks/useGlobalSummary.js
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export function useGlobalSummary() {
  const [globalSummary, setGlobalSummary] = useState([]);
  const [globalTotal, setGlobalTotal] = useState(0);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [globalError, setGlobalError] = useState(null);
  const [globalLastUpdateDate, setGlobalLastUpdateDate] = useState("");

  const formatLastUpdateDate = (value) => {
    if (!value) return "No disponible";

    const rawValue = String(value).trim();
    const parsedDate = new Date(rawValue);

    if (Number.isNaN(parsedDate.getTime())) {
      return rawValue;
    }

    return parsedDate.toLocaleDateString("es-BO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  useEffect(() => {
    let isActive = true;

    const fetchGlobalData = async () => {
      setGlobalLoading(true);
      setGlobalError(null);

      try {
        const { data: summaryData, error: summaryError } = await supabase.rpc(
          "obtener_resumen_global_por_codigo"
        );

        if (summaryError) {
          throw summaryError;
        }

        const safeSummary = Array.isArray(summaryData) ? summaryData : [];

        const normalizedSummary = safeSummary
          .map((item) => ({
            codigo: item.codigo || "Sin Código",
            count: Number(item.count || 0),
          }))
          .filter((item) => item.count > 0);

        const total = normalizedSummary.reduce(
          (sum, item) => sum + item.count,
          0
        );

        if (!isActive) return;

        setGlobalSummary(normalizedSummary);
        setGlobalTotal(total);

        const { data: dateData, error: dateError } = await supabase.rpc(
          "obtener_ultima_fecha_reporte_global"
        );

        if (!isActive) return;

        if (dateError) {
          console.error(
            "Error al obtener última fecha de actualización:",
            dateError.message
          );

          setGlobalLastUpdateDate("No disponible");
        } else {
          setGlobalLastUpdateDate(formatLastUpdateDate(dateData));
        }
      } catch (err) {
        console.error("Error al obtener datos globales:", err);

        if (!isActive) return;

        setGlobalSummary([]);
        setGlobalTotal(0);
        setGlobalLastUpdateDate("No disponible");
        setGlobalError(
          "No se pudieron cargar los datos globales de la base. Inténtelo nuevamente más tarde."
        );
      } finally {
        if (isActive) {
          setGlobalLoading(false);
        }
      }
    };

    fetchGlobalData();

    return () => {
      isActive = false;
    };
  }, []);

  return {
    globalSummary,
    globalTotal,
    globalLoading,
    globalError,
    globalLastUpdateDate,
  };
}