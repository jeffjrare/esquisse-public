---
name: payments-stripe
description: Stripe payments where a mistake costs money: webhooks, fulfilment, test and live keys, refunds, disputes and Canadian sales tax. Use before writing or changing a webhook handler, a Checkout Session or PaymentIntent flow, what the product grants after a payment, a refund or dispute path, a Stripe key or secret in config, or how GST/HST and QST are charged.
---

# Payments with Stripe: money moves once, and the webhook is the truth

**As of:** 2026-10-26

**Paths:** `*stripe*`, `*Stripe*`, `billing/`, `payments/`, `checkout/`, `webhooks/`

**Stack:** `stripe`, `@stripe/*`

**If today is more than 180 days past `**As of:**`, say so in one line before relying on a threshold, a retry window or an API behaviour, and keep going.** Re-check a dated fact against its source before it decides anything.

**A project skill on the same topic wins** where the two disagree. Paid features inside an iOS app go through In-App Purchase, and the storefronts where linking out is allowed are `esq:store-review`'s rule (guideline 3.1.1): read it before pricing anything sold in the iOS app. Retries, backoff and dead letters for the work a webhook hands off belong to `esq:background-jobs`; amounts written in French or English to `esq:i18n-fr-en`.

A payment bug rarely throws. It grants twice, grants nothing, or charges tax nobody files, and the first report comes from a customer or an accountant. Each rule below says how to see one first.

**These rules are documented, not yet tested in a shipped project.** They follow Stripe's, the CRA's and Revenu Québec's pages, checked on the date above. Treat each as a hypothesis to prove in the first integration that relies on it.

## Webhooks

- **Verify the signature on the raw request body, before any parser touches it.** *Why:* Stripe signs the exact bytes it sent (`Stripe-Signature`, HMAC-SHA256 over `timestamp.body`); a JSON body parser that re-serialises the payload changes those bytes and every verification fails, or a developer "fixes" it by skipping verification, and then anyone can post a fake `payment_succeeded` ([webhooks](https://docs.stripe.com/webhooks), checked 2026-10-26). *Fix:* mount the webhook route with a raw-body reader (`express.raw({ type: 'application/json' })` ahead of `express.json()`, `await request.text()` in a fetch-style handler) and call the library's `constructEvent` / `parseEventNotification` with the endpoint's `whsec_` secret. Keep the library's 5-minute timestamp tolerance; a tolerance of `0` disables the replay check. *Check:* a test posts a correctly signed body through the real middleware stack and expects 2xx, and a body with one byte changed and expects 400.
- **Handle each event at most once, keyed by its event id, and never by arrival order.** *Why:* Stripe may deliver the same event more than once, retries for up to three days in live mode, and does not guarantee order: `invoice.paid` can arrive before `customer.subscription.created`, and `created` is in seconds, so two events can share it. *Fix:* record processed `event.id`s under a unique constraint and skip a repeat; on any event, fetch the object's current state from the API (or the thin event's related object) instead of trusting the order or the snapshot. *Check:* a test delivers the same event twice and then two events in reverse order, and asserts one grant and the right final state.
- **Return 2xx fast, and do the slow work after.** *Why:* a handler that sends email or calls another service before answering times out, Stripe retries, and the work runs again. Checkout also waits up to 10 seconds for the `checkout.session.completed` delivery before redirecting the customer. *Fix:* verify, record the event, enqueue the work, answer; the queue's own rules are in `esq:background-jobs`.
- **The webhook route is exempt from the app's CSRF check, and from nothing else.** *Why:* a framework CSRF middleware rejects Stripe's POST, and the tempting fix is to disable CSRF globally. Exempt the one route; its signature check is its protection.

## Test, live and the secrets

- **Test and live keys, accounts and webhook secrets never mix, and each environment names which one it holds.** *Why:* the same endpoint has a different `whsec_` secret for test and live, and a sandbox's events are not live ones; a staging server holding a live key charges real cards, and a production server holding a test secret rejects every real event as unsigned. *Fix:* one variable per secret per environment, a startup check that the secret key's prefix (`sk_live_` / `sk_test_`, or a restricted `rk_`) matches the environment, and secret keys only on the server. *Check:* grep the client bundle and the repo for `sk_` and `whsec_`; boot staging with a live key and see it refuse.

## Checkout, PaymentIntents and what gets granted

- **Grant on the webhook, never on the success page alone.** *Why:* a customer can pay and lose the connection before the landing page loads; a delayed method (a bank debit) completes the Session with `payment_status: 'unpaid'` and succeeds later, in `checkout.session.async_payment_succeeded` ([fulfilment](https://docs.stripe.com/checkout/fulfillment), checked 2026-10-26). *Fix:* one `fulfill(sessionId)` that retrieves the Session, checks `payment_status` is not `unpaid`, grants and records the grant, called from both `checkout.session.completed` and `…async_payment_succeeded`, and optionally from the landing page. It is safe to call twice, concurrently (a unique row per Session, not a read-then-write). *Check:* call it twice in parallel for one Session and count one grant.
- **A PaymentIntent's state is read from Stripe, not inferred from the client.** *Why:* the client's `confirmPayment` resolving says the browser finished, not that the money arrived (`processing`, `requires_action` for 3-D Secure). Grant on `payment_intent.succeeded`.
- **An amount is integers in the currency's minor unit, computed on the server.** *Why:* a price sent from the client is a price the client chooses, and floating-point cents drift. *Fix:* create the Session or PaymentIntent from server-side Price ids or server-computed integers.

## Refunds and disputes

- **A refund and a dispute each revoke what was granted, through their own events.** Listen for `charge.refunded` (or `refund.updated`) and `charge.dispute.created`, and decide with the product owner what a refund or a dispute takes back. *Why:* a dispute debits the disputed amount and a non-refundable fee (outside Mexico) at once, holds the funds for the two or three months the dispute lasts, and while it is open you cannot refund outside the dispute process; the response deadline is usually 7–21 days ([how disputes work](https://docs.stripe.com/disputes/how-disputes-work), checked 2026-10-26). An unanswered inquiry can escalate to a chargeback that cannot be won. *Check:* a test for each event asserts the access change, and someone is notified of `charge.dispute.created` with its `evidence_details.due_by`.

## GST/HST and QST

**This states the rule and its source; whether it applies, and how a product registers and files, is the business's call with its accountant. It is not tax advice.**

- **A Canadian business must register for GST/HST and QST once its worldwide taxable supplies (with its associates') pass $30,000 in one calendar quarter or over four consecutive quarters.** Passing it in one quarter makes the supply that crosses it taxable; passing it over four quarters ends small-supplier status at the end of the following month ([CRA, when to register](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/when-register-charge), [Revenu Québec, small suppliers](https://www.revenuquebec.ca/en/businesses/consumption-taxes/gsthst-and-qst/registering-for-the-gst-and-qst/small-suppliers/), both checked 2026-10-26). Taxi and ride-share businesses register whatever their sales; public service bodies have a different limit.
- **Stripe Tax does not watch the home-country threshold for you.** *Why:* its monitoring covers sales outside the country the business is based in, and it calculates only for the registrations you add under Tax › Locations ([Stripe Tax in Canada](https://docs.stripe.com/tax/supported-countries/canada), checked 2026-10-26). A Québec business that turns Stripe Tax on and adds nothing collects nothing. Stripe files returns only for non-residents under the simplified GST/HST regime. *Fix, depending on the choice:* with Stripe Tax, add the GST/HST and QST registrations the day they take effect and assign a product tax code to every product; without it, apply the registrant's own rates (GST 5 %, QST 9.975 % for a Québec customer, HST where it applies) from the customer's province, in one place. *Check:* a test invoice to a Québec address shows both taxes once the registrations exist, and none before.
