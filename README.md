# Wave Backend API Documentation

**Base URL:** `https://<your-backend-url>`  

All endpoints are **JSON** unless specified.

---

## 1. Users

### Create User
**POST** `/api/users/create`

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "profile_url": "https://...jpg"
}
