package com.bolsillo.app

import android.app.Activity
import android.content.ContentValues
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.webkit.*
import android.widget.Toast
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
            useWideViewPort = true
            loadWithOverviewMode = true
        }
        CookieManager.getInstance().setAcceptCookie(true)
        web.addJavascriptInterface(Puente(), "Android")

        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(v: WebView, r: WebResourceRequest): Boolean {
                val u = r.url.toString()
                if (u.startsWith("http") && u.contains("alexanderai24.github.io")) return false
                startActivity(Intent(Intent.ACTION_VIEW, r.url)); return true
            }
            override fun onReceivedError(v: WebView, req: WebResourceRequest, err: WebResourceError) {
                if (req.isForMainFrame) Toast.makeText(this@MainActivity,
                    "Sin conexión. Ábrela una vez con internet para guardarla.",
                    Toast.LENGTH_LONG).show()
            }
        }
        web.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(v: WebView, cb: ValueCallback<Array<Uri>>,
                                           p: FileChooserParams): Boolean {
                subirArchivo?.onReceiveValue(null); subirArchivo = cb
                return try { startActivityForResult(p.createIntent(), PEDIR_ARCHIVO); true }
                catch (e: Exception) { subirArchivo = null; false }
            }
        }
        web.loadUrl(URL)
        recibirCompartido(intent)
    }

    override fun onNewIntent(i: Intent?) {
        super.onNewIntent(i)
        setIntent(i)
        recibirCompartido(i)
    }

    /** Lo que llega cuando compartes un pantallazo o un texto hacia Bolsillo. */
    private fun recibirCompartido(i: Intent?) {
        if (i == null) return
        val accion = i.action ?: return
        if (accion != Intent.ACTION_SEND && accion != Intent.ACTION_SEND_MULTIPLE) return

        val tipo = i.type ?: ""
        if (tipo.startsWith("text/")) {
            val t = i.getStringExtra(Intent.EXTRA_TEXT) ?: return
            Inbox.agregar(applicationContext, "compartido", "Texto compartido", "", t)
            avisar("Texto recibido")
            refrescar()
            return
        }
        if (!tipo.startsWith("image/")) return

        val imagenes = mutableListOf<Uri>()
        if (accion == Intent.ACTION_SEND) {
            (i.getParcelableExtra<Uri>(Intent.EXTRA_STREAM))?.let { imagenes.add(it) }
        } else {
            i.getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM)?.let { imagenes.addAll(it) }
        }
        if (imagenes.isEmpty()) return

        Toast.makeText(this, "Leyendo la captura...", Toast.LENGTH_SHORT).show()
        var faltan = imagenes.size
        for (u in imagenes) {
            Lector.leer(applicationContext, u) { texto ->
                if (!texto.isNullOrBlank())
                    Inbox.agregar(applicationContext, "captura", "Captura", "", texto)
                faltan--
                if (faltan <= 0) { avisar("Captura leída"); refrescar() }
            }
        }
    }

    private fun avisar(t: String) = runOnUiThread {
        Toast.makeText(this, t, Toast.LENGTH_SHORT).show()
    }

    private fun refrescar() = runOnUiThread {
        web.evaluateJavascript("window.onMensajesNuevos && window.onMensajesNuevos();", null)
    }

    override fun onActivityResult(req: Int, res: Int, data: Intent?) {
        super.onActivityResult(req, res, data)
        if (req == PEDIR_ARCHIVO) {
            subirArchivo?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res, data))
            subirArchivo = null
        }
    }

    override fun onBackPressed() { if (web.canGoBack()) web.goBack() else super.onBackPressed() }

    override fun onResume() { super.onResume(); refrescar() }

    inner class Puente {
        @JavascriptInterface fun esNativo(): Boolean = true
        @JavascriptInterface fun pendientes(): String = Inbox.pendientes(applicationContext)
        @JavascriptInterface fun registro(): String = Inbox.registro(applicationContext)
        @JavascriptInterface fun consumir(ids: String) = Inbox.consumir(applicationContext, ids)
        @JavascriptInterface fun limpiar(todo: Boolean) = Inbox.limpiar(applicationContext, todo)

        /** Guarda los respaldos en la carpeta Descargas. */
        @JavascriptInterface fun guardarArchivo(nombre: String, contenido: String): Boolean {
            return try {
                if (Build.VERSION.SDK_INT >= 29) {
                    val v = ContentValues().apply {
                        put(MediaStore.MediaColumns.DISPLAY_NAME, nombre)
                        put(MediaStore.MediaColumns.MIME_TYPE, "application/octet-stream")
                        put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                    }
                    val uri = contentResolver.insert(
                        MediaStore.Downloads.EXTERNAL_CONTENT_URI, v) ?: return false
                    contentResolver.openOutputStream(uri)?.use { it.write(contenido.toByteArray()) }
                } else {
                    val dir = Environment.getExternalStoragePublicDirectory(
                        Environment.DIRECTORY_DOWNLOADS)
                    File(dir, nombre).writeText(contenido)
                }
                avisar("Guardado en Descargas: $nombre"); true
            } catch (e: Exception) { false }
        }

        @JavascriptInterface fun aviso(texto: String) = avisar(texto)
    }
}
