export type PasoGuia = { titulo: string; descripcion: string; href?: string; accion?: string };
export type GuiaFlujo = { titulo: string; pasos: [PasoGuia, PasoGuia, PasoGuia] };
