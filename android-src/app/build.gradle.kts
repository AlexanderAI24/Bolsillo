plugins{
  id("com.android.application")
  id("org.jetbrains.kotlin.android")
}
android{
  namespace = "com.bolsillo.app"
  compileSdk = 34
  defaultConfig{
    applicationId = "com.bolsillo.app"
    minSdk = 24
    targetSdk = 34
    versionCode = 2
    versionName = "2.0"
  }
  // La llave viene de un secreto de GitHub: no queda en el repositorio.
  // Sirve para que las actualizaciones se instalen encima sin desinstalar.
  signingConfigs{
    create("propia"){
      val f = file("llave.jks")
      if (f.exists()){
        storeFile = f
        storePassword = System.getenv("CLAVE_ALMACEN") ?: "bolsillo2026"
        keyAlias = System.getenv("ALIAS_LLAVE") ?: "bolsillo"
        keyPassword = System.getenv("CLAVE_LLAVE") ?: "bolsillo2026"
      }
    }
  }
  buildTypes{
    val usar = file("llave.jks").exists()
    debug{ if (usar) signingConfig = signingConfigs.getByName("propia") }
    release{
      isMinifyEnabled = false
      if (usar) signingConfig = signingConfigs.getByName("propia")
    }
  }
  compileOptions{
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }
  kotlinOptions{ jvmTarget = "17" }
}
dependencies{
  // Lector de texto de Google: corre dentro del telefono, sin internet y sin costo
  implementation("com.google.mlkit:text-recognition:16.0.1")
}
