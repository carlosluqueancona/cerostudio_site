# Videos de hover del portafolio

Al pasar el mouse sobre una card del portafolio (solo escritorio, pantalla ≥1024 px),
el sitio busca un video con el **slug del nombre de la card** y, si existe, lo reproduce
en bucle sobre la imagen. Si el archivo no existe no pasa nada: la card se comporta igual
que siempre. No hay que tocar el CMS ni el código.

## Cómo se arma el slug
Nombre de la card → minúsculas, sin acentos, espacios y signos → guiones.

| Card en el admin        | Archivo que debes subir              |
|-------------------------|--------------------------------------|
| IMVEC                   | `imvec.webm`                         |
| Mainoflex               | `mainoflex.webm`                      |
| Seminuevos Coapa        | `seminuevos-coapa.webm`               |
| Dr. César Salas Mártir  | `dr-cesar-salas-martir.webm`          |
| Molduras y Troqueles MYR| `molduras-y-troqueles-myr.webm`       |

(Si prefieres fijar el nombre a mano, agrega `data-slug="lo-que-quieras"` a la card.)

## Especificaciones del video
- 3 segundos, en bucle, **sin audio**.
- Proporción 16:10 o 16:9 (se recorta a la caja de la imagen con `object-fit: cover`).
- WebM VP9, **máximo 1 MB**. Opcionalmente un `.mp4` con el mismo nombre como respaldo
  para navegadores viejos.
- Contenido sugerido: scroll suave por el sitio del cliente, un hover sobre un botón,
  o la vista móvil desplazándose. Nada de cortes rápidos.

## Cómo generarlo con ffmpeg
Graba la pantalla (QuickTime → Grabación de pantalla) y luego:

```bash
ffmpeg -i grabacion.mov -ss 00:00:02 -t 3 -an \
  -vf "scale=960:-2,fps=24" \
  -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 \
  imvec.webm

# respaldo opcional en mp4
ffmpeg -i imvec.webm -an -c:v libx264 -crf 26 -pix_fmt yuv420p imvec.mp4
```

Revisa el peso con `ls -lh`. Si pasa de 1 MB, sube el `-crf` (36–40) o baja la escala a 800.

## Para empezar
Los tres proyectos con resultado publicado son los que más conviene grabar:
`imvec.webm`, `mainoflex.webm` y `seminuevos-coapa.webm`.
