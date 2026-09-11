# Bolsillo · app Android

El APK es una cáscara: la app web sigue viviendo en GitHub Pages.
Actualizar la app = subir `index.html` como siempre. No hay que recompilar.

El APK solo aporta lo que el navegador no puede hacer:
- leer notificaciones (Nu, BBVA, Google Pay)
- leer SMS (Bancolombia)
- guardar los respaldos en Descargas
- almacenamiento propio, aislado de Chrome

## Cómo se compila
GitHub lo hace solo. Cada vez que cambie algo dentro de `android-src/`
se dispara el flujo `.github/workflows/android.yml` y deja el APK
descargable en la pestaña Actions.

## Si cambias de usuario o repositorio
Edita la constante `URL` en `app/src/main/java/com/bolsillo/app/MainActivity.kt`.

## Interpretación de mensajes
No está en Kotlin. Kotlin solo captura texto crudo y lo entrega.
Todo el análisis está en `index.html`, función `interpretar()`.
Así se agregan bancos nuevos sin tocar el APK.
