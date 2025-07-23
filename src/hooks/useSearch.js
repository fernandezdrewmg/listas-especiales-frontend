// src/hooks/useSearch.js
import { useState, useCallback } from "react";
import { supabase } from "../supabaseClient"; // Asegúrate de que esta ruta sea correcta

export function useSearch() {
  // Estados relacionados con la búsqueda, ahora gestionados por este hook
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [codigoCount, setCodigoCount] = useState(0);
  const [fechaReciente, setFechaReciente] = useState("");
  const [summaryData, setSummaryData] = useState({});

  // `executeSearch` es la función que el componente `SearchPage` llamará
  // `useCallback` asegura que esta función no cambie en cada render,
  // lo que es útil si se pasa a componentes hijos para evitar re-renderizados innecesarios.
  const executeSearch = useCallback(async (termNorm) => {
    setError(""); // Limpiamos errores previos
    setLoading(true); // Activamos el estado de carga
    setResults([]); // Limpiamos resultados anteriores
    setCodigoCount(0); // Reiniciamos el conteo de códigos
    setFechaReciente(""); // Reiniciamos la fecha reciente
    setSummaryData({}); // Limpiamos los datos del resumen

    // Si el término de búsqueda está vacío después de limpiar espacios, no hacemos la llamada API
    if (!termNorm) {
      setLoading(false);
      return;
    }

    try {
      // Llamada a la función RPC de Supabase para buscar nombres
      const { data, error } = await supabase.rpc("buscar_nombres", {
        termino_busqueda: termNorm,
      });

      if (error) {
        // Si hay un error de Supabase, lo lanzamos para que lo capture el bloque catch
        throw error;
      }

      // ✅ Calcula resumen por Código
      // Recorremos los datos para contar las ocurrencias de cada "Codigo"
      const counts = data.reduce((acc, item) => {
        const code = item.Codigo || "Sin Código"; // Si no hay código, lo agrupamos como "Sin Código"
        acc[code] = (acc[code] || 0) + 1; // Incrementamos el contador para ese código
        return acc;
      }, {});
      setSummaryData(counts); // Actualizamos el estado con el resumen

      // ✅ Cuenta códigos únicos
      // Creamos un Set para obtener solo los valores únicos de "Codigo"
      const codigosUnicos = new Set(data.map((item) => item.Codigo));
      setCodigoCount(codigosUnicos.size); // Actualizamos el estado con el número de códigos únicos

      // ✅ Encuentra fecha más reciente
      // Filtramos las fechas válidas y las convertimos a objetos Date
      const fechas = data
        .map((item) => item.FechaReporte)
        .filter(Boolean) // Elimina valores nulos o indefinidos
        .map((fecha) => new Date(fecha));

      if (fechas.length > 0) {
        // Encontramos la fecha máxima y la formateamos a un string legible
        const fechaMax = new Date(Math.max(...fechas));
        const formateada = fechaMax.toLocaleDateString("es-BO", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        setFechaReciente(formateada); // Actualizamos el estado con la fecha más reciente
      }

      setResults(data); // Actualizamos el estado con los resultados de la búsqueda
    } catch (err) {
      // Capturamos y manejamos cualquier error durante la búsqueda
      console.error("Error en la búsqueda:", err);
      setError("Error al buscar datos. Inténtelo de nuevo.");
    } finally {
      // Aseguramos que el estado de carga se desactive siempre
      setLoading(false);
    }
  }, []); // El array de dependencias vacío indica que esta función no depende de ningún estado o prop del hook

  // Devolvemos todos los estados y la función de búsqueda para que el componente que use este hook los pueda acceder
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