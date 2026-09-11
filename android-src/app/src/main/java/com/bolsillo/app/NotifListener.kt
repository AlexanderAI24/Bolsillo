package com.bolsillo.app

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

class NotifListener : NotificationListenerService() {

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        try {
            val e = sbn.notification?.extras ?: return
            val titulo = e.getCharSequence("android.title")?.toString() ?: ""
            val texto = e.getCharSequence("android.text")?.toString()
                ?: e.getCharSequence("android.bigText")?.toString() ?: ""
            if (titulo.isBlank() && texto.isBlank()) return

            val pm = packageManager
            val nombreApp = try {
                pm.getApplicationLabel(pm.getApplicationInfo(sbn.packageName, 0)).toString()
            } catch (ex: Exception) { sbn.packageName }

            Inbox.agregar(applicationContext, sbn.packageName, nombreApp, titulo, texto)
        } catch (ex: Exception) { /* nunca tumbar el servicio del sistema */ }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {}
}
