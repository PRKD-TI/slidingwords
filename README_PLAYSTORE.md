# Guia Completo: Publicação na Google Play Store

Este guia contém tudo o que você precisa saber para gerar o pacote final e publicar o **Sliding Words** na Google Play Store.

---

## 📁 Estrutura que foi Criada

1. **`android/`** -> Projeto completo nativo do Android Studio:
   - `app/src/main/assets/` -> Todos os arquivos do jogo (HTML/CSS/JS, dicionário, áudio) já embutidos.
   - `app/src/main/java/com/prkd/slidingwords/MainActivity.kt` -> WebView configurada com carregamento seguro local (`WebViewAssetLoader`), áudio habilitado, feedback tátil e confirmação ao sair.
   - `app/src/main/res/mipmap-*/` -> Ícones do app gerados em todas as resoluções Android (mdpi até xxxhdpi).
   - `build.gradle.kts` e `app/build.gradle.kts` -> Configurados com `targetSdk = 35` (Android 15), `minSdk = 24`, pacote `com.prkd.slidingwords`.

2. **`playstore_assets/`** -> Materiais exigidos pelo Google Play Console:
   - `playstore_icon_512x512.png` -> Ícone oficial da loja em 512x512 px (PNG 32-bit).
   - `feature_graphic_1024x500.png` -> Banner de destaque oficial da loja em 1024x500 px com a marca Sliding Words.
   - `politica_privacidade.html` -> Política de privacidade completa e em conformidade com as regras do Google.
   - `playstore_listing.txt` -> Título, descrição curta, descrição completa formatada, tags, respostas de segurança de dados e classificação indicativa (IARC).

---

## 🚀 Como Gerar o Arquivo `.aab` (Android App Bundle)

### Método Recomendado (Via Android Studio):
1. Abra o **Android Studio**.
2. Clique em **Open** e selecione a pasta:
   `/home/prkd/jogo_android/android`
3. Aguarde o Android Studio sincronizar o Gradle.
4. No menu superior, clique em:
   **Build** > **Generate Signed Bundle / APK...**
5. Escolha **Android App Bundle** e clique em **Next**.
6. Em **Key store path**:
   - Se for a primeira vez, clique em **Create new...** e escolha onde salvar seu arquivo `.jks` (ex: `minha-chave.jks`). Defina uma senha que você lembre.
7. Selecione o destino de compilação como **release** e clique em **Create**.
8. Pronto! O Android Studio gerará o arquivo:
   `android/app/build/outputs/bundle/release/app-release.aab`.

---

## 📋 Passo a Passo no Google Play Console

Enquanto você aguarda a validação de endereço e telefone da sua conta:

### 1. Criar o Aplicativo
- No painel da Play Store, clique no botão azul **Criar app**.
- Nome do app: **Sliding Words**
- Idioma padrão: **Português (Brasil)**
- Tipo de app: **Jogo**
- Gratuito ou pago: **Gratuito**
- Aceite as declarações e clique em **Criar app**.

### 2. Preencher a Ficha da Loja
Vá em **Apresentação na loja** > **Ficha principal da loja**:
- Copie e cole os textos que preparamos no arquivo [playstore_listing.txt](file:///home/prkd/jogo_android/playstore_assets/playstore_listing.txt).
- Faça o upload do ícone [playstore_icon_512x512.png](file:///home/prkd/jogo_android/playstore_assets/playstore_icon_512x512.png).
- Faça o upload do banner [feature_graphic_1024x500.png](file:///home/prkd/jogo_android/playstore_assets/feature_graphic_1024x500.png).
- Anexe pelo menos 2 capturas de tela (prints) do jogo rodando no celular.

### 3. Configurar a Política de Privacidade
- No menu lateral, acesse **Conteúdo do app** > **Política de privacidade**.
- Você pode hospedar o arquivo [politica_privacidade.html](file:///home/prkd/jogo_android/playstore_assets/politica_privacidade.html) gratuitamente no GitHub Pages (ou qualquer servidor web) e colar o link.

### 4. Responder aos Questionários
No menu **Conteúdo do app**:
- **Classificação de conteúdo (IARC):** Responda às perguntas conforme o gabarito no `playstore_listing.txt` (todas as respostas de violência/conteúdo são "Não"). O jogo receberá selo **Livre**.
- **Segurança dos dados (Data Safety):** Marque que o aplicativo **NÃO coleta nem compartilha dados**.
- **Público-alvo:** Selecione maiores de 13 anos (ou todas as idades).

### 5. Enviar a Versão e a Etapa dos 20 Testadores
- Vá em **Versão** > **Teste Fechado**.
- Envie o arquivo `.aab`.
- Como a conta é nova, a Google exige convidar **20 e-mails de amigos/familiares** para instalar o app via link de teste fechado e mantê-lo instalado por 14 dias.
- Passados os 14 dias, o botão de **Promover para Produção** será liberado e seu jogo estará disponível publicamente para todo o mundo na Play Store!
