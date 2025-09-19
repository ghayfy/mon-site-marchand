# Mon Projet — E-commerce (Vue 3 + Express + MySQL) — v2

## Lancer avec Docker
```bash
cp .env.example .env
docker compose up -d --build
# Front: http://localhost:5173
# API:   http://localhost:4000
```
Stripe webhook (requis pour marquer PAID) :
```bash
stripe login
stripe listen --forward-to localhost:4000/api/webhooks/stripe
```

## v2 — Inclus
- Admin Commandes : statut + export PDF `/api/checkout/orders/:id/pdf`
- Adresses (CRUD + défaut) + snapshot dans Order
- Frais de port : `SHIPPING_MODE=flat|weight` (+ `weight` produit)
- Devis Panier : `GET /api/checkout/quote` -> `{ subtotal, shipping, total }`
- PayPal : `/api/paypal/create-order`, `/api/paypal/capture`, webhook `/api/webhooks/paypal` (squelette)
- Front : `/admin/orders`, `/addresses`, `/success` (retour PayPal), panier avec totaux.

## Auth
`POST /api/auth/register`, `POST /api/auth/login` (JWT).  
Mettre `Authorization: Bearer <token>` pour routes protégées.

## Remarques
- Renforcer validation, sécurité, emails (Nodemailer), UI (Tailwind/Vuetify) selon besoin.
