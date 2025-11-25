#!/bin/sh

# Obtener el puerto del backend (por defecto 9087)
BACKEND_PORT=${BACKEND_PORT:-9087}

# Detectar si estamos en Codespaces y construir URL automáticamente
if [ -n "$CODESPACE_NAME" ]; then
  API_URL=${API_URL:-https://${CODESPACE_NAME}-${BACKEND_PORT}.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}/api}
  echo "Detectado Codespaces - API_URL: $API_URL"
else
  API_URL=${API_URL:-http://localhost:${BACKEND_PORT}/api}
  echo "Entorno local/kubernetes - API_URL: $API_URL"
fi

# Reemplazar PLACEHOLDER_API_URL en todos los archivos JS compilados
echo "Reemplazando PLACEHOLDER_API_URL con: $API_URL"
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|PLACEHOLDER_API_URL|$API_URL|g" {} \;

# Iniciar Nginx
echo "Iniciando Nginx..."
nginx -g 'daemon off;'
