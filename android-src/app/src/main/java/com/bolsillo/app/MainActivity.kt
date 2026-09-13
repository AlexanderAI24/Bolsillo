package com.bolsillo.app

import android.app.Activity
import android.content.ContentValues
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.provider.Settings
import android.webkit.*
import android.widget.Toast
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

class MainActivity : Activity() {

    private lateinit var web: WebView
    private var subirArchivo: ValueCallback<Array<Uri>>? = null
    private val PEDIR_ARCHIVO = 101

    companion object {
        // La app web vive en GitHub Pages: actualizarla NO requiere recompilar el APK.
        const val URL = "https://alexanderai24.github.io/Bolsillo/"
    }

    override fun onCreate(b: Bundle?) {
        super.onCreate(b)
        web = WebView(this)
        setContentView(web)

        WebView.setWebContentsDebuggingEnabled(true)
        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mediaPlaybackRequiresUserGesture = false
            useWideViewPort = true
            loadWithOverviewMode = true
        }
        CookieManager.getInstance().setAcceptCookie(true)
        web.addJavascriptInterface(Puente(), "Android")

        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(v: WebView, r: WebResourceRequest): Boolean {
                val u = r.url.toString()
                if (u.startsWith("http") && u.contains("alexanderai24.github.io")) return false
                startActivity(Intent(Intent.ACTION_VIEW, r.url))
                return true
            }
            override fun onReceivedError(v: WebView, req: WebResourceRequest, err: WebResourceError) {
                if (req.isForMainFrame) {
                    Toast.makeText(this@MainActivity,
                        "Sin conexión. Abre la app una vez con internet para guardarla.",
                        Toast.LENGTH_LONG).show()
                }
            }
        }
        web.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(v: WebView, cb: ValueCallback<Array<Uri>>,
                                           p: FileChooserParams): Boolean {
                subirArchivo?.onReceiveValue(null)
                subirArchivo = cb
                return try {
                    startActivityForResult(p.createIntent(), PEDIR_ARCHIVO); true
                } catch (e: Exception) { subirArchivo = null; false }
            }
        }
        web.load()
    }

    private fun WebView.load() = loadUrl(URL)

    override fun onActivityResult(req: Int, res: Int, data: Intent?) {
        super.onActivityResult(req, res, data)
        if (req == PEDIR_ARCHIVO) {
            subirArchivo?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res, data))
            subirArchivo = null
        }
    }

    override fun onBackPressed() {
        if (web.canGoBack()) web.goBack() else super.onBackPressed()
    }

    override fun onResume() {
        super.onResume()
        // avisa a la app web que revise si llegaron mensajes nuevos
        web.evaluateJavascript("window.onMensajesNuevos && window.onMensajesNuevos();", null)
    }

    /** Puente entre Kotlin y la app web */
    inner class Puente {

        @JavascriptInterface fun esNativo(): Boolean = true

        @JavascriptInterface fun pendientes(): String = Inbox.pendientes(applicationContext)

        @JavascriptInterface fun registro(): String = Inbox.registro(applicationContext)

        @JavascriptInterface fun consumir(ids: String) = Inbox.consumir(applicationContext, ids)

        @JavascriptInterface fun limpiar(todo: Boolean) = Inbox.limpiar(applicationContext, todo)

        @JavascriptInterface fun permisoNotificaciones(): Boolean {
            val activos = Settings.Secure.getString(contentResolver, "enabled_notification_listeners")
            return activos != null && activos.contains(packageName)
        }

        @JavascriptInterface fun abrirPermisoNotificaciones() {
            runOnUiThread {
                try {
                    startActivity(Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS"))
                } catch (e: Exception) {
                    startActivity(Intent(Settings.ACTION_SETTINGS))
                }
            }
        }

        /** Lee correos del banco por IMAP. Solo trae los de remitentes autorizados. */
        @JavascriptInterface fun leerCorreo(host: String, puerto: Int, usuario: String,
                                            clave: String, carpeta: String,
                                            remitentesJson: String, dias: Int): Int {
            return try {
                val permitidos = mutableListOf<String>()
                val a = JSONArray(remitentesJson)
                for (i in 0 until a.length()) permitidos.add(a.getString(i).lowercase())
                Correo.leer(applicationContext, host, puerto, usuario, clave,
                    carpeta, permitidos, dias)
            } catch (e: Exception) { -1 }
        }

        /** Guarda los respaldos en la carpeta Descargas. */
        @JavascriptInterface fun guardarArchivo(nombre: String, contenido: String): Boolean {
            return try {
                if (Build.VERSION.SDK_INT >= 29) {
                    val v = ContentValues().apply {
                        put(MediaStore.MediaColumns.DISPLAY_NAME, nombre)
                        put(MediaStore.MediaColumns.MIME_TYPE, "application/octet-stream")
                        put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                    }
                    val uri = contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v)
                        ?: return false
                    contentResolver.openOutputStream(uri)?.use { it.write(contenido.toByteArray()) }
                } else {
                    val dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                    File(dir, nombre).writeText(contenido)
                }
                runOnUiThread {
                    Toast.makeText(this@MainActivity, "Guardado en Descargas: $nombre",
                        Toast.LENGTH_LONG).show()
                }
                true
            } catch (e: Exception) { false }
        }

        @JavascriptInterface fun aviso(texto: String) {
            runOnUiThread { Toast.makeText(this@MainActivity, texto, Toast.LENGTH_SHORT).show() }
        }
    }
}
