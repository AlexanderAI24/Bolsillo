package com.bolsillo.app

import android.content.Context
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.PrintWriter
import java.net.Socket
import javax.net.ssl.SSLSocketFactory

/**
 * Lector de correo por IMAP, escrito a mano para no depender de librerías.
 * Solo lee: nunca borra, mueve ni marca nada.
 * Y solo guarda los correos cuyo remitente está en la lista autorizada.
 */
object Correo {

    private const val TIEMPO = 20000

    fun leer(ctx: Context, host: String, puerto: Int, usuario: String, clave: String,
             carpeta: String, permitidos: List<String>, dias: Int): Int {

        var guardados = 0
        var socket: Socket? = null
        try {
            socket = SSLSocketFactory.getDefault().createSocket(host, puerto)
            socket.soTimeout = TIEMPO
            val entra = BufferedReader(InputStreamReader(socket.getInputStream(), Charsets.UTF_8))
            val sale = PrintWriter(socket.getOutputStream(), true)
            var etiqueta = 0
            fun mandar(orden: String): List<String> {
                etiqueta++
                val t = "a$etiqueta"
                sale.println("$t $orden")
                val lineas = mutableListOf<String>()
                while (true) {
                    val l = entra.readLine() ?: break
                    lineas.add(l)
                    if (l.startsWith("$t OK") || l.startsWith("$t NO") || l.startsWith("$t BAD")) break
                }
                return lineas
            }

            entra.readLine() // saludo del servidor
            val login = mandar("LOGIN \"$usuario\" \"$clave\"")
            if (login.none { it.contains(" OK") }) return -2   // credenciales malas

            mandar("SELECT \"$carpeta\"")

            // el servidor filtra por fecha; el remitente lo revisamos nosotros
            val desde = java.text.SimpleDateFormat("dd-MMM-yyyy", java.util.Locale.US)
                .format(java.util.Date(System.currentTimeMillis() - dias * 86_400_000L))
            val busca = mandar("SEARCH SINCE $desde")
            val ids = busca.firstOrNull { it.startsWith("* SEARCH") }
                ?.removePrefix("* SEARCH")?.trim()?.split(" ")
                ?.filter { it.isNotBlank() } ?: emptyList()

            // de los más nuevos hacia atrás, con tope para no demorar
            for (id in ids.reversed().take(120)) {
                val cabeza = mandar("FETCH $id (BODY.PEEK[HEADER.FIELDS (FROM SUBJECT DATE)])")
                    .joinToString("\n")
                val de = Regex("(?im)^From:\\s*(.+)$").find(cabeza)?.groupValues?.get(1)?.trim() ?: ""
                if (permitidos.isNotEmpty() &&
                    permitidos.none { de.lowercase().contains(it) }) continue

                val asunto = decodificar(
                    Regex("(?im)^Subject:\\s*(.+)$").find(cabeza)?.groupValues?.get(1)?.trim() ?: "")

                val cuerpo = mandar("FETCH $id (BODY.PEEK[TEXT])").joinToString("\n")
                val texto = limpiar(cuerpo)
                if (Inbox.agregar(ctx, "correo:$de", "Correo", asunto, texto)) guardados++
            }
            mandar("LOGOUT")
        } catch (e: Exception) {
            return -1
        } finally {
            try { socket?.close() } catch (e: Exception) {}
        }
        return guardados
    }

    /** Quita etiquetas HTML y deja texto plano legible. */
    private fun limpiar(crudo: String): String {
        var t = crudo
        t = t.replace(Regex("(?is)<(script|style)[^>]*>.*?</\\1>"), " ")
        t = t.replace(Regex("(?i)<br\\s*/?>|</p>|</tr>|</div>"), "\n")
        t = t.replace(Regex("<[^>]+>"), " ")
        t = t.replace("&nbsp;", " ").replace("&amp;", "&")
            .replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", "\"")
        // el correo suele venir en quoted-printable
        t = t.replace("=\r\n", "").replace("=\n", "")
        t = Regex("=([0-9A-Fa-f]{2})").replace(t) {
            try { it.groupValues[1].toInt(16).toChar().toString() } catch (e: Exception) { it.value } }
        t = t.replace(Regex("[ \\t]+"), " ").replace(Regex("\n{2,}"), "\n")
        return t.trim().take(1200)
    }

    /** Asuntos codificados tipo =?UTF-8?B?...?= */
    private fun decodificar(s: String): String {
        return try {
            Regex("=\\?[^?]+\\?([BbQq])\\?([^?]*)\\?=").replace(s) { m ->
                val datos = m.groupValues[2]
                if (m.groupValues[1].uppercase() == "B")
                    String(android.util.Base64.decode(datos, android.util.Base64.DEFAULT))
                else datos.replace("_", " ").let { q ->
                    Regex("=([0-9A-Fa-f]{2})").replace(q) {
                        it.groupValues[1].toInt(16).toChar().toString() } }
            }
        } catch (e: Exception) { s }
    }
}
