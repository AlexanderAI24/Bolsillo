package com.bolsillo.app

import android.content.Context
import android.graphics.BitmapFactory
import android.net.Uri
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlin.math.abs

/**
 * Lee el texto de un pantallazo usando el reconocedor de Google,
 * que funciona dentro del telefono: sin internet, sin cuenta y sin costo.
 *
 * El orden importa: las apps de banco muestran el comercio a la izquierda
 * y el monto a la derecha, asi que se reordena por filas antes de entregarlo.
 */
object Lector {

    fun leer(ctx: Context, uri: Uri, listo: (String?) -> Unit) {
        try {
            val entrada = ctx.contentResolver.openInputStream(uri)
            val mapa = BitmapFactory.decodeStream(entrada)
            entrada?.close()
            if (mapa == null) { listo(null); return }

            val imagen = InputImage.fromBitmap(mapa, 0)
            val motor = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
            motor.process(imagen)
                .addOnSuccessListener { res -> listo(ordenar(res)) }
                .addOnFailureListener { listo(null) }
        } catch (e: Exception) { listo(null) }
    }

    /** Agrupa por filas y dentro de cada fila ordena de izquierda a derecha. */
    private fun ordenar(res: com.google.mlkit.vision.text.Text): String {
        data class Trozo(val texto: String, val x: Int, val y: Int, val alto: Int)
        val trozos = mutableListOf<Trozo>()
        for (bloque in res.textBlocks) for (linea in bloque.lines) {
            val c = linea.boundingBox ?: continue
            trozos.add(Trozo(linea.text.trim(), c.left, c.centerY(), c.height()))
        }
        if (trozos.isEmpty()) return ""
        trozos.sortBy { it.y }

        val salida = StringBuilder()
        var fila = mutableListOf<Trozo>()
        var refY = trozos[0].y
        var tolerancia = maxOf(12, trozos[0].alto / 2)

        fun volcar() {
            if (fila.isEmpty()) return
            fila.sortBy { it.x }
            salida.append(fila.joinToString(" ") { it.texto }).append('\n')
            fila = mutableListOf()
        }
        for (t in trozos) {
            if (abs(t.y - refY) > tolerancia) { volcar(); refY = t.y; tolerancia = maxOf(12, t.alto / 2) }
            fila.add(t)
        }
        volcar()
        return salida.toString().trim()
    }
}
