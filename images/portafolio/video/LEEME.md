# Videos de hover del portafolio

Los loops **se suben desde el admin**, no desde esta carpeta: entra a
`/blog/admin/` → pestaña **Portafolio** → edita el proyecto → campo
**“Video de hover (opcional)”** → *Subir*. El archivo se guarda en R2
(`portafolio/video/…`), la URL queda en la base junto al resto de los datos del
proyecto, y con *Guardar* se regenera el sitio.

Al pasar el mouse sobre la card (solo computadora con mouse, pantalla ≥ 1024 px)
el video se reproduce en bucle sobre la imagen. Si el proyecto no tiene video, la
card se comporta igual que siempre. Para quitarlo, usa el botón **✕ Quitar** y
guarda.

Esta carpeta ya no se usa para servir los videos; queda solo como referencia de
cómo prepararlos.

## Especificaciones
- 3 segundos, en bucle, **sin audio**.
- Proporción 16:10 o 16:9 (se recorta a la caja de la imagen con `object-fit: cover`).
- WebM VP9 (o MP4 H.264), **máximo 3 MB**; apunta a menos de 1 MB.
- Contenido sugerido: scroll suave por el sitio del cliente, un hover sobre un
  botón, o la vista móvil desplazándose. Nada de cortes rápidos.

## Cómo generarlo con ffmpeg
Graba la pantalla (QuickTime → Grabación de pantalla) y luego:

```bash
ffmpeg -i grabacion.mov -ss 00:00:02 -t 3 -an \
  -vf "scale=960:-2,fps=24" \
  -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 \
  imvec.webm
```

Revisa el peso con `ls -lh`. Si pasa de 1 MB, sube el `-crf` (36–40) o baja la
escala a 800. El nombre del archivo da igual: la URL la guarda el admin.

## Por dónde empezar
Los tres proyectos con resultado publicado: **IMVEC**, **Mainoflex** y
**Seminuevos Coapa**.
