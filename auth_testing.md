# AMYA Auth Testing

Admin login (JWT, httpOnly cookie + Bearer fallback).

## MongoDB
```
mongosh
use test_database
db.users.find({role:"admin"}).pretty()
```
bcrypt hash must start with `$2b$`. Unique index on users.email.

## API
```
curl -c cookies.txt -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"amulya@amayafoods.in","password":"AmyaFounder@2026"}'
curl -b cookies.txt http://localhost:8001/api/auth/me
```
Login returns user + sets access_token/refresh_token cookies. /me returns same user.

Admin-only endpoints require cookie or Authorization: Bearer <token>.
