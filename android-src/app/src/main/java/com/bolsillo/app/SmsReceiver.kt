package com.bolsillo.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony

class SmsReceiver : BroadcastReceiver() {
    override fun onReceive(c: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
        try {
            // un SMS largo llega partido: se juntan las partes del mismo remitente
            val partes = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
            val de = partes.firstOrNull()?.originatingAddress ?: "SMS"
            val cuerpo = partes.joinToString("") { it.messageBody ?: "" }
            Inbox.agregar(c.applicationContext, "sms:$de", "SMS $de", "", cuerpo)
        } catch (e: Exception) { }
    }
}
