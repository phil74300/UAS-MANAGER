#!/bin/bash
# UAS Manager — Script d'installation Capacitor iOS
# © 2026 Philippe CONTE

echo "🛸 UAS Manager — Installation iOS"
echo "=================================="

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js non installé. Va sur nodejs.org pour l'installer."
    exit 1
fi
echo "✅ Node.js $(node --version)"

# Vérifier si dans le bon dossier
if [ ! -f "package.json" ]; then
    echo "❌ Lance ce script depuis le dossier du projet"
    exit 1
fi

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

# Créer le dossier www et copier les fichiers
echo "📁 Préparation du dossier www..."
mkdir -p www/icons

# Copier les HTML si présents dans le dossier courant
cp *.html www/ 2>/dev/null && echo "✅ Fichiers HTML copiés" || echo "⚠️  Copiez manuellement vos HTML dans www/"
cp *.js www/ 2>/dev/null || true

# Copier manifest
cp manifest.json www/

# Initialiser Capacitor
echo "⚡ Initialisation Capacitor..."
npx cap init "UAS Manager" com.conte.uasmanager --web-dir www 2>/dev/null || true

# Ajouter iOS
echo "🍎 Ajout de la plateforme iOS..."
npx cap add ios

# Copier les fichiers vers iOS
echo "📋 Synchronisation avec iOS..."
npx cap copy ios

echo ""
echo "✅ Installation terminée !"
echo ""
echo "Prochaine étape : npx cap open ios"
echo "Puis dans Xcode : sélectionne ton équipe et clique ▶️"
echo ""
echo "© 2026 Philippe CONTE · UAS Manager"
