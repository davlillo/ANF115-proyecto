import { iniciales } from "@/lib/texto";
import { cn } from "@/lib/utils";

type AvatarProps = {
  nombre: string;
  className?: string;
};

/** Avatar con iniciales sobre fondo neutro. Decorativo: el nombre va al lado. */
export function Avatar({ nombre, className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-superficie-tenue text-xs font-semibold text-texto",
        className,
      )}
    >
      {iniciales(nombre)}
    </span>
  );
}
