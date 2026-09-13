# Bolsillo · app Android

El APK es una cáscara: la app web vive en GitHub Pages.
Actualizar la app = subir `index.html` como siempre. No hay que recompilar.

## Permisos
Ninguno sensible. Solo internet.
No lee notificaciones, ni SMS, ni correo.

## Qué aporta el APK
- Recibe pantallazos compartidos y les lee el texto dentro del celular
  con el reconocedor de Google (sin internet, sin cuenta y sin costo).
- Recibe texto compartido, como el SMS de Bancolombia.
- Guarda los respaldos en la carpeta Descargas.
- Almacenamiento propio, aislado de Chrome.

## Cómo se compila
GitHub lo hace solo. Al cambiar algo dentro de `android-src/` se dispara
`.github/workflows/android.yml` y deja el APK en la pestaña Actions.

## Si cambias de usuario o repositorio
Edita la constante `URL` en `app/src/main/java/com/bolsillo/app/MainActivity.kt`.

## Interpretación de movimientos
No está en Kotlin. Kotlin solo lee el texto y lo entrega.
Todo el análisis está en `index.html`: `interpretarTexto()`, `parseLista()`
e `interpretar()`. Así se agregan bancos nuevos sin tocar el APK.
