# Comandos cURL para probar la API

Aquí tienes los comandos `curl` listos para testear las rutas de la aplicación. 
Asegúrate de tener la aplicación corriendo (`npm run start:dev`) en el puerto 3000.

> **Nota:** En las rutas protegidas, recuerda reemplazar `TU_TOKEN_AQUI` por el `access_token` real que te devuelve la ruta de Login, y `ID_DEL_USUARIO` por el `_id` real de MongoDB.

---

## 1. Autenticación (Auth)

### Registrar un nuevo usuario
Crea un usuario nuevo. La contraseña debe cumplir con los requisitos de tu DTO (letras, números, caracteres especiales y mín. 8 caracteres).

```bash
curl -X POST http://localhost:3000/auth/register \
-H "Content-Type: application/json" \
-d '{
  "name": "Lucas",
  "surname": "Perez",
  "mail": "lucas.perez@example.com",
  "password": "Password123!"
}'
```

### Iniciar Sesión (Login)
Devuelve el `access_token` que vas a necesitar para las siguientes peticiones.

```bash
curl -X POST http://localhost:3000/auth/login \
-H "Content-Type: application/json" \
-d '{
  "mail": "lucas.perez@example.com",
  "password": "Password123!"
}'
```

### Ver el perfil del usuario logueado (Protegida)
Obtiene los datos del usuario basándose en el token.

```bash
curl -X GET http://localhost:3000/auth/profile \
-H "Authorization: Bearer TU_TOKEN_AQUI"
```

---

## 2. Usuarios (Users)

### Obtener todos los usuarios (Protegida)

```bash
curl -X GET http://localhost:3000/users \
-H "Authorization: Bearer TU_TOKEN_AQUI"
```

### Obtener un usuario por ID (Protegida)

```bash
curl -X GET http://localhost:3000/users/ID_DEL_USUARIO \
-H "Authorization: Bearer TU_TOKEN_AQUI"
```

### Modificar un usuario (Protegida)

```bash
curl -X PUT http://localhost:3000/users/ID_DEL_USUARIO \
-H "Content-Type: application/json" \
-H "Authorization: Bearer TU_TOKEN_AQUI" \
-d '{
  "name": "Lucas Modificado"
}'
```

### Eliminar un usuario (Protegida)

```bash
curl -X DELETE http://localhost:3000/users/ID_DEL_USUARIO \
-H "Authorization: Bearer TU_TOKEN_AQUI"
```
