# Stripe Checkout Integration

Hosted Stripe Checkout is used for the existing recurring Pro subscription flow. Checkout creates a session from the monthly or yearly Stripe Price ID configured in the application.

## Values to Replace

Set these environment variables to the corresponding CAD recurring Price IDs from Stripe. Keep test-mode IDs in the first two variables and live-mode IDs in the production variables:

| Variable | What to Set |
|----------|-------------|
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Test-mode Price ID for CAD $5/month |
| `STRIPE_PRO_YEARLY_PRICE_ID` | Test-mode Price ID for CAD $45/year |
| `STRIPE_PRO_MONTHLY_PRICE_ID_PRODUCTION` | Live-mode Price ID for CAD $5/month |
| `STRIPE_PRO_YEARLY_PRICE_ID_PRODUCTION` | Live-mode Price ID for CAD $45/year |

Also configure `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` for the matching Stripe mode. Do not commit secret values.

## Configured Parameters

**File containing Checkout Session parameters:**
- [src/trpc/index.ts](./src/trpc/index.ts)

| Parameter | Value |
|-----------|-------|
| `ui_mode` | `hosted` (Stripe Node SDK 14.25.0) |
| `billing_address_collection` | `auto` |
| `phone_number_collection.enabled` | `false` |
| `automatic_tax.enabled` | `false` |
| `allow_promotion_codes` | `false` |
| `payment_method_collection` | `always` |
| `integration_identifier` | `hosted_web_0002` |
| `origin_context` | `web` |

The existing application values for `mode`, success and cancel URLs, line items, and webhook user metadata are preserved.

## Setup and Testing

1. Create recurring CAD prices for $5/month and $45/year in Stripe.
2. Add the test and live Price IDs and Stripe secrets to the matching environments.
3. Restart the app after changing local environment variables.
4. Test locally with Stripe test-mode keys and [Stripe's test card numbers](https://docs.stripe.com/testing).
5. Confirm the Checkout completion webhook updates the user's subscription in the database.

Stripe SDK 14 uses `ui_mode: hosted`; do not change it to `hosted_page` unless upgrading to Stripe Node SDK 21 or newer.

`submit_type: auto` is not sent: Stripe's Checkout API restricts `submit_type` to payment-mode sessions, while this app sells recurring subscriptions. Hosted subscription Checkout uses its automatic submit behavior by default.

## Flow

The pricing page selects a monthly or yearly interval. The server resolves the corresponding configured Price ID, creates the hosted Checkout Session, and redirects the customer to Stripe. The existing webhook uses session metadata to associate the completed subscription with the signed-in user.

## Resources

- [Stripe Checkout documentation](https://docs.stripe.com/checkout)
- [Stripe testing](https://docs.stripe.com/testing)
- [Stripe support](https://support.stripe.com)
