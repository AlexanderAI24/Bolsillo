package com.bolsillo.app

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * Bandeja de mensajes capturados.
 * Guarda texto crudo: aqui NO se interpreta nada.
 * La interpretacion vive en la app web, asi se puede mejorar
 * sin tener que recompilar el APK.
 */
object Inbox {
    private const val PREFS = "bolsillo"
    private const val KEY = "bandeja"
    private const val KEY_LOG = "registro"
    private const val MAX = 300

    // solo guardamos lo que parece plata
    private val PLATA = Regex("""(\$|COP|cop)\s?\d""")

    private fun prefs(c: Context) = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    private fun leer(c: Context, k: String): JSONArray =
        try { JSONArray(prefs(c).getString(k, "[]")) } catch (e: Exception) { JSONArray() }

    private fun guardar(c: Context, k: String, a: JSONArray) {
        val recorte = if (a.length() <= MAX) a else JSONArray().also {
            for (i in a.length() - MAX until a.length()) it.put(a.get(i))
        }
        prefs(c).edit().putString(k, recorte.toString()).apply()
    }

    /** Entra un mensaje nuevo. Devuelve true si se guardo. */
    fun agregar(c: Context, origen: String, app: String, titulo: String, texto: String): Boolean {
        val completo = listOf(titulo, texto).filter { it.isNotBlank() }.joinToString(" — ")
        if (completo.isBlank()) return false

        // el registro crudo sirve para el modo aprendizaje
        val log = leer(c, KEY_LOG)
        log.put(JSONObject().apply {
            put("origen", origen); put("app", app)
            put("texto", completo); put("ts", System.currentTimeMillis())
        })
        guardar(c, KEY_LOG, log)

        if (!PLATA.containsMatchIn(completo)) return false

        val bandeja = leer(c, KEY)
        // evita repetidos: mismo texto en los ultimos 5 minutos
        val ahora = System.currentTimeMillis()
        for (i in 0 until bandeja.length()) {
            val o = bandeja.getJSONObject(i)
            if (o.optString("texto") == completo && ahora - o.optLong("ts") < 300_000) return false
        }
        bandeja.put(JSONObject().apply {
            put("id", "n" + ahora + "-" + (0..999).random())
            put("origen", origen); put("app", app)
            put("texto", completo); put("ts", ahora)
        })
        guardar(c, KEY, bandeja)
        return true
    }

    fun pendientes(c: Context): String = leer(c, KEY).toString()

    fun registro(c: Context): String = leer(c, KEY_LOG).toString()

    fun consumir(c: Context, idsJson: String) {
        val quitar = mutableSetOf<String>()
        try {
            val a = JSONArray(idsJson)
            for (i in 0 until a.length()) quitar.add(a.getString(i))
        } catch (e: Exception) { return }
        val actual = leer(c, KEY)
        val nueva = JSONArray()
        for (i in 0 until actual.length()) {
            val o = actual.getJSONObject(i)
            if (!quitar.contains(o.optString("id"))) nueva.put(o)
        }
        guardar(c, KEY, nueva)
    }

    fun limpiar(c: Context, tambienRegistro: Boolean) {
        prefs(c).edit().putString(KEY, "[]").apply()
        if (tambienRegistro) prefs(c).edit().putString(KEY_LOG, "[]").apply()
    }
}
