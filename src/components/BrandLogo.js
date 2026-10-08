import { useState } from "react";

const applicationLogo = `${process.env.PUBLIC_URL || ""}/logo.svg`;

// Conserva el logo configurado; si falta o falla, muestra la marca de la aplicación.
export default function BrandLogo({
  src,
  alt = "Logo Listas Especiales",
  className,
}) {
  const [failedSource, setFailedSource] = useState(null);
  const useConfiguredLogo = src && failedSource !== src;
  return (
    <img
      src={useConfiguredLogo ? src : applicationLogo}
      alt={useConfiguredLogo ? alt : "Logo Listas Especiales"}
      className={className}
      onError={useConfiguredLogo ? () => setFailedSource(src) : undefined}
      decoding="async"
    />
  );
}
