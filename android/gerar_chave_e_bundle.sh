#!/bin/bash
# Script utilitário para gerar a Chave de Assinatura (Keystore) e compilar o AAB

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

KEYSTORE_FILE="release.jks"
ALIAS_NAME="palavras_key"

echo "=================================================="
echo "  Gerador de Pacote Android (AAB) para a Play Store"
echo "=================================================="

if [ ! -f "$KEYSTORE_FILE" ]; then
    echo ""
    echo "[1/2] Gerando nova chave de assinatura segura ($KEYSTORE_FILE)..."
    echo "Responda às perguntas abaixo (ou pressione Enter) e GUARDE A SENHA com segurança:"
    echo ""
    keytool -genkeypair -v \
        -keystore "$KEYSTORE_FILE" \
        -alias "$ALIAS_NAME" \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -storepass "android123" \
        -keypass "android123" \
        -dname "CN=SlidingWords, OU=Games, O=Dev, L=Brasil, ST=Brasil, C=BR"
    echo ""
    echo "Chave '$KEYSTORE_FILE' criada com sucesso! (Senha padrão temporária: android123)"
else
    echo "[1/2] Chave '$KEYSTORE_FILE' já existente. Prosseguindo..."
fi

echo ""
echo "[2/2] Para compilar o arquivo final .aab:"
echo "Opção A (Recomendada): Abra a pasta 'android' no Android Studio e clique em:"
echo "       Menu Build -> Generate Signed Bundle / APK -> Android App Bundle."
echo ""
echo "Opção B (Linha de comando): Execute:"
echo "       ./gradlew bundleRelease"
echo ""
echo "O arquivo gerado ficará em: app/build/outputs/bundle/release/app-release.aab"
echo "=================================================="
