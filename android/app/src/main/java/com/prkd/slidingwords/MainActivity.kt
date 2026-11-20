package com.prkd.slidingwords

import android.annotation.SuppressLint
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Configuração de tela e barra de status escura
        window.statusBarColor = Color.parseColor("#0F172A")
        window.navigationBarColor = Color.parseColor("#0F172A")

        webView = WebView(this).apply {
            setBackgroundColor(Color.parseColor("#0F172A"))
            overScrollMode = View.OVER_SCROLL_NEVER
        }
        setContentView(webView)

        // Carregador seguro de assets locais recomendado pelo Google
        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView.webViewClient = object : WebViewClientCompat() {
            override fun shouldInterceptRequest(
                view: WebView?,
                request: WebResourceRequest
            ): WebResourceResponse? {
                return assetLoader.shouldInterceptRequest(request.url)
            }
        }

        // Configurações do WebView
        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mediaPlaybackRequiresUserGesture = false

            // Segurança: restringe acessos a arquivos diretos do sistema
            allowFileAccess = false
            allowContentAccess = false

            // Suporte a zoom desativado para comportamento de app nativo
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            useWideViewPort = true
            loadWithOverviewMode = true
        }

        // Carrega o jogo localmente via HTTPS seguro interno
        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html")

        // Tratamento do botão Voltar
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                AlertDialog.Builder(this@MainActivity)
                    .setTitle("Sair do Jogo")
                    .setMessage("Deseja realmente sair do Sliding Words?")
                    .setPositiveButton("Sim") { _, _ -> finish() }
                    .setNegativeButton("Continuar Jogando", null)
                    .show()
            }
        })
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
