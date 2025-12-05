# Frontend

## Construir imagen

```bash
docker build -t vidalluyo0/vg-frontend:1.0 .
docker push vidalluyo0/vg-frontend:1.0
```

## Configurar URL del backend

La URL se configura en el deployment de Kubernetes:

```yaml
env:
- name: API_URL
  value: "http://vg-ms-assistance:9087"
```

Cambia el valor y aplica el deployment.
