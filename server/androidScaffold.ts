import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { PYTHON_SCRIPTS_DIR, TMP_DIR } from './workspace.ts';

const execFileAsync = promisify(execFile);

/**
 * Generates a clean, modular Android Studio (Kotlin + Chaquopy + Jetpack Compose) source bundle
 * for PyLab Studio so users can also open & build the Android APK locally in Android Studio.
 */
export async function generateAndroidSourceZip(): Promise<Buffer> {
  const bundleDir = path.join(TMP_DIR, `pylab_android_${Date.now()}`);
  const appDir = path.join(bundleDir, 'app');
  const srcKotlin = path.join(appDir, 'src', 'main', 'java', 'com', 'pylab', 'studio');
  const dirs = [
    path.join(srcKotlin, 'runtime'),
    path.join(srcKotlin, 'packages'),
    path.join(srcKotlin, 'projects'),
    path.join(srcKotlin, 'editor'),
    path.join(srcKotlin, 'learning'),
    path.join(appDir, 'src', 'main', 'python'),
  ];
  for (const d of dirs) fs.mkdirSync(d, { recursive: true });

  fs.writeFileSync(
    path.join(bundleDir, 'settings.gradle.kts'),
    `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "PyLabStudio"
include(":app")
`,
    'utf-8'
  );

  fs.writeFileSync(
    path.join(bundleDir, 'build.gradle.kts'),
    `plugins {
    id("com.android.application") version "8.5.2" apply false
    id("org.jetbrains.kotlin.android") version "2.0.20" apply false
    id("com.chaquo.python") version "15.0.1" apply false
}
`,
    'utf-8'
  );

  fs.writeFileSync(
    path.join(appDir, 'build.gradle.kts'),
    `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.chaquo.python")
}

android {
    namespace = "com.pylab.studio"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.pylab.studio"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        ndk {
            abiFilters += listOf("arm64-v8a", "armeabi-v7a", "x86_64")
        }
    }

    buildFeatures {
        compose = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

chaquopy {
    defaultConfig {
        version = "3.11"
        pip {
            install("requests")
            install("flask")
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-compose:1.9.2")
    implementation(platform("androidx.compose:compose-bom:2024.09.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.documentfile:documentfile:1.0.1")
}
`,
    'utf-8'
  );

  fs.writeFileSync(
    path.join(appDir, 'src', 'main', 'AndroidManifest.xml'),
    `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <application
        android:allowBackup="true"
        android:label="PyLab Studio"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.Material.NoActionBar">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`,
    'utf-8'
  );

  fs.writeFileSync(
    path.join(srcKotlin, 'MainActivity.kt'),
    `package com.pylab.studio

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.chaquo.python.Python
import com.chaquo.python.android.AndroidPlatform
import com.pylab.studio.runtime.PythonRuntimeManager

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (!Python.isStarted()) {
            Python.start(AndroidPlatform(this))
        }
        val runtime = PythonRuntimeManager(this)
        setContent {
            PyLabAppRoot(runtime = runtime)
        }
    }
}
`,
    'utf-8'
  );

  fs.writeFileSync(
    path.join(srcKotlin, 'runtime', 'PythonRuntimeManager.kt'),
    `package com.pylab.studio.runtime

import android.content.Context
import com.chaquo.python.Python
import java.io.File

class PythonRuntimeManager(private val context: Context) {
    private val py: Python get() = Python.getInstance()

    fun getPythonVersion(): String {
        val sys = py.getModule("sys")
        return sys["version"].toString()
    }

    fun executeScript(scriptFile: File, workingDir: File): Map<String, Any?> {
        val runner = py.getModule("pylab_android_runner")
        val result = runner.callAttr("run_file", scriptFile.absolutePath, workingDir.absolutePath)
        return mapOf("output" to result.toString())
    }
}
`,
    'utf-8'
  );

  fs.writeFileSync(
    path.join(appDir, 'src', 'main', 'python', 'pylab_android_runner.py'),
    `import sys, io, os, traceback, runpy

def run_file(file_path: str, cwd: str) -> dict:
    old_stdout, old_stderr = sys.stdout, sys.stderr
    buf_out, buf_err = io.StringIO(), io.StringIO()
    sys.stdout, sys.stderr = buf_out, buf_err
    old_cwd = os.getcwd()
    exit_code = 0
    try:
        os.chdir(cwd)
        if cwd not in sys.path:
            sys.path.insert(0, cwd)
        runpy.run_path(file_path, run_name="__main__")
    except Exception:
        exit_code = 1
        traceback.print_exc(file=buf_err)
    finally:
        os.chdir(old_cwd)
        sys.stdout, sys.stderr = old_stdout, old_stderr
    return {"stdout": buf_out.getvalue(), "stderr": buf_err.getvalue(), "exit_code": exit_code}
`,
    'utf-8'
  );

  fs.writeFileSync(
    path.join(bundleDir, 'README.md'),
    `# PyLab Studio — Android Studio Project (Kotlin + Chaquopy 15 + Python 3.11)

## Opening & Building in Android Studio
1. Open this folder in Android Studio Ladybug+ (JDK 17).
2. Allow Gradle Sync to download Chaquopy 15.0.1 and Python 3.11 Android wheels.
3. Build Debug APK: \`./gradlew assembleDebug\`
4. Output APK path: \`app/build/outputs/apk/debug/app-debug.apk\`
`,
    'utf-8'
  );

  const outZip = path.join(TMP_DIR, `PyLabStudio_Android_${Date.now()}.zip`);
  const script = path.join(PYTHON_SCRIPTS_DIR, 'pylab_zip.py');
  try {
    await execFileAsync('python3', [script, 'export', bundleDir, outZip, 'true']);
    return fs.readFileSync(outZip);
  } finally {
    fs.rmSync(bundleDir, { recursive: true, force: true });
    if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
  }
}
