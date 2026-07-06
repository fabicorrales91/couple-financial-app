const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function RollingDigit({ digit }: { digit: number }) {
  return (
    // OJO: este contenedor NO debe llevar "items-center" ni ser flex con
    // centrado propio. El carrete interior mide 10em (10 digitos apilados) y
    // esta ventana solo debe mostrar 1em; si se centra el carrete aqui, el
    // translateY de abajo (que asume que el carrete arranca en y=0) queda
    // descuadrado y se ven fragmentos de dos digitos distintos superpuestos
    // (numeros ilegibles). La alineacion con los simbolos (€, coma, punto) la
    // da el padre `RollingNumber` (inline-flex items-center), no este span.
    <span className="inline-block h-[1em] overflow-hidden">
      <span
        className="flex flex-col transition-transform duration-500 ease-out"
        style={{ transform: `translateY(-${digit * 10}%)` }}
      >
        {DIGITS.map((n) => (
          <span
            key={n}
            className="flex h-[1em] items-center justify-center leading-none tabular-nums"
          >
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

/**
 * Muestra un numero formateado donde cada digito gira verticalmente
 * (efecto carrusel / maquina de casino) cuando el valor cambia.
 * El ancho de cada digito se calcula por su propio contenido (no fijo),
 * para que no se solapen ni se corten con distintas fuentes/tamanos.
 *
 * Tanto los digitos como los simbolos (€, coma, punto) comparten la misma
 * caja de 1em de alto centrada por flexbox, para que queden alineados sobre
 * la misma linea (antes usaban align-bottom, que un motor de flex ignora en
 * sus hijos directos y producia numeros desalineados entre si).
 */
export function RollingNumber({
  value,
  formatOptions,
  locale = "es-ES",
  className,
}: {
  value: number;
  formatOptions?: Intl.NumberFormatOptions;
  locale?: string;
  className?: string;
}) {
  const formatted = value.toLocaleString(locale, formatOptions);
  const chars = Array.from(formatted);
  const lastIndex = chars.length - 1;

  return (
    <span className={`inline-flex items-center whitespace-nowrap tabular-nums ${className ?? ""}`}>
      {chars.map((char, i) => {
        const key = lastIndex - i;
        const isDigit = char >= "0" && char <= "9";
        return isDigit ? (
          <RollingDigit key={key} digit={Number(char)} />
        ) : (
          <span
            key={key}
            className="inline-flex h-[1em] items-center justify-center whitespace-pre leading-none"
          >
            {char}
          </span>
        );
      })}
    </span>
  );
}
