import * as React from "react";

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

/**
 * Envuelve a RollingNumber para que, la PRIMERA vez que se monta (justo
 * despues del skeleton de carga inicial), arranque en 0 y suba animado hasta
 * el valor real, como si estuviera "sumando" el dinero. Los refrescos
 * posteriores (sync manual, nueva transaccion) NO vuelven a arrancar en 0:
 * simplemente pasan el valor nuevo a RollingNumber, que ya anima la
 * transicion entre el valor viejo y el nuevo por su cuenta. Sin esto, cada
 * refresco reiniciaria la cuenta desde 0, lo cual se ve mal para cambios
 * chicos (ej. sumar una transaccion de 12 EUR no deberia reiniciar el
 * contador completo del saldo).
 */
export function CountUpNumber({
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
  const [displayValue, setDisplayValue] = React.useState(0);
  const hasMountedRef = React.useRef(false);

  React.useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setDisplayValue(value));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    setDisplayValue(value);
  }, [value]);

  return (
    <RollingNumber
      value={displayValue}
      formatOptions={formatOptions}
      locale={locale}
      className={className}
    />
  );
}
