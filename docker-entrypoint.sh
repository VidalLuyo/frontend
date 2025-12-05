#!/bin/sh

# Verificar que API_URL esté definida
if [ -z "$API_URL" ]; then
  echo "ERROR: API_URL no está definida"
  exit 1
fi

echo "Configurando API_URL: $API_URL"

# Reemplazar PLACEHOLDER_API_URL en todos los archivos JS compilados
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|PLACEHOLDER_API_URL|$API_URL|g" {} \;

echo "Reemplazo completado. Iniciando nginx..."

# Iniciar nginx
nginx -g 'daemon off;'
