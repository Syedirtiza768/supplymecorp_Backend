# Cart API Endpoints

This PR introduces the canonical cart contract used by the frontend.

## Routes
- `GET /cart` → returns `{ items, totalQty, subtotal }`
- `POST /cart` → body `{ productId, qty }` (qty default 1), returns same shape

### Response shape
```json
{
  "items": [
    {
      "key": "SKU123",
      "productId": "123",
      "title": "Product name",
      "qty": 2,
      "unitPrice": 1200,
      "lineTotal": 2400
    }
  ],
  "totalQty": 2,
  "subtotal": 2400
}
```

## Notes
- Server must recalc prices; do not trust client prices.
- If using cookie sessions, set `SameSite=None; Secure` and handle CORS with `credentials: true`.
- If using JWT, accept `Authorization: Bearer <token>` and return 401 on missing/invalid token.

See `examples/` folders for drop-in implementations (NestJS & Laravel).
