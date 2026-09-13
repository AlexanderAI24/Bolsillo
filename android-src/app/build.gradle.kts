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
  buildTypes{ release{ isMinifyEnabled = false } }
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
