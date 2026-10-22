# APAPSIF · Psicología forense en Panamá

Sitio institucional estático en español de la Asociación Panameña de Psicología Forense.

## Publicación gratuita

En **Settings → Pages → Build and deployment**, seleccionar **GitHub Actions** como Source.
El flujo **Publish APAPSIF** construye y valida las páginas antes de publicarlas. Una vez activado Pages, ejecutar el flujo desde **Actions → Publish APAPSIF → Run workflow** si la primera ejecución había fallado porque Pages todavía no estaba activado.

El flujo obtiene la dirección real de GitHub Pages y genera automáticamente enlaces, metadatos, sitemap y búsqueda con la ruta correcta. `apapsif.com` todavía no está conectado. No configurar un dominio personalizado hasta verificar su propiedad y DNS.

## Desarrollo

Requiere Python 3; no hay paquetes de ejecución, base de datos ni servicios de pago.

```sh
python3 scripts/build.py
python3 scripts/check.py
python3 -m http.server 4173 --directory dist
```

La construcción local es una vista previa no indexable. El flujo público usa `scripts/build_github_pages.py` con la URL proporcionada por GitHub. No publicar la construcción local directamente.

- `scripts/build.py`: páginas HTML, SEO, sitemap y buscador.
- `dist/assets/`: estilos, JavaScript e identidad visual.
- `content/`: referencias y registros de verificación.
- `.github/workflows/pages.yml`: publicación automática en GitHub Pages.

## Contenido y contacto

El correo enlazado, `apapsif.panama@gmail.com`, aparece en el perfil público de Instagram de APAPSIF. No se envió un mensaje de prueba. El sitio no recibe pagos, expedientes ni formularios. Los contenidos introductorios enlazan sus fuentes; no se presentan como asesoría profesional ni se atribuyen cargos, servicios o certificaciones sin verificación.

Diseño adaptable, búsqueda con acentos, biblioteca y glosario filtrables, navegación con teclado, enlaces de correo y controles de lectura. SEO en español para Panamá, con URL canónicas, datos estructurados y sitemap.
