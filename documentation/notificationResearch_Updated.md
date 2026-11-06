# Buzz Bitez — Notification Research 

## What I looked into

I wanted to see what it would take to send Buzz Bitez alerts when someone posts free food, instead of relying on students to keep checking the website. I researched two options: **email notifications** and **iPhone push notifications**. This is a proposal and a set of notes for our team, not documentation of completed notification features.

## What is working or partly connected right now

| Area | What I found in the current project |
| --- | --- |
| User signup/login | `JavaScript/signup.js` calls backend endpoints. `RESTEndpoint/RESTEndpoint.py` has user creation and login routes. |
| Email addresses | `RESTEndpoint/models.py` already stores a unique email on each `User`, so there is no need to create another table just for email addresses. |
| Food event API | `POST /events`, `GET /events`, and other event routes exist in FastAPI, and events are stored in PostgreSQL. |
| Broadcasting food | `JavaScript/broadcast.js` now attempts to `POST` an event to `/events`, but it also still saves a separate copy in `localStorage`. |
| Displaying food events | `JavaScript/alerts.js` still calls `loadLocalEvents()`. Its unused `loadEvents()` calls `/event` (singular), but the backend route is `/events` (plural). |
| Notification settings | `JavaScript/settings.js` still saves the email and text toggle values in `localStorage`. The backend does not save notification preferences yet. |
| Email / push delivery | Neither is implemented yet. |


## Issues to fix before sending notifications

1. **Match the broadcast payload to the API.** `broadcast.js` sends `messageBoard` and `directMessages`, while `EventIn` expects `enable_message_board` and `allow_direct_messages`. Because the API gives these fields defaults, the request may save an event but ignore the checkbox choices. `food_type` is also not passed in the API payload. We should map these fields correctly and check the result.
2. **Handle failed event requests.** `broadcast.js` calls `fetch()` without checking `response.ok`; it then saves the local event and shows a success message. This can make a failed backend request look successful. We should only show success when the API actually returns a successful response, and use the saved event returned by the server.
3. **Read posted events from the backend.** `alerts.js` currently displays local events. We should switch it to `GET /events`, fix the plural route, and map backend `times`, `image`, `enable_message_board` etc. into the card format.
4. **Confirm cross-origin requests work.** FastAPI does not currently configure CORS middleware. If the web pages and API run on different origins, we need an explicit trusted-origin CORS configuration or a same-origin proxy.
5. **Secure account-specific notification settings.** The login endpoint currently uses `GET /login/{username}/{password}`, which puts the password in the URL, and it doesn't establish server-verified sessions for later endpoints. Before exposing user preference/subscription routes, we should move to a secure login/session or token flow and identify the user from that—not from a username supplied in a request body.

I would avoid adding automatic notifications until we have reliably saved events and know who is authorized to change settings.

## Option 1 — Email notifications

This seems like the best first version because we already collect email addresses and can test it without an iPhone.

**Basic idea:** A user opts into email alerts in settings. We save the preference in PostgreSQL. When `POST /events` successfully creates a new event, the backend starts a task that emails opted-in users about the event. A transactional email provider such as [Resend](https://resend.com/fastapi) is one possible choice; SendGrid or Amazon SES are alternatives. We should check actual account limits and domain verification requirements before choosing.

Proposed email example:

> Subject: Buzz Bitez — Free pizza at the Union
>
> New food was posted at the Union. Check Buzz Bitez for the time and details. You can turn off these emails in settings.

### What we'd add

- A `notification_preferences` table linked to the existing `users.username`, with `email_enabled` and `push_enabled` flags (defaulting to false), and an update timestamp.
- Authenticated FastAPI routes to read/update the logged-in student's preferences.
- `settings.js` calls to fetch and save those settings instead of relying only on `localStorage`.
- A separate backend notification helper (for example, `RESTEndpoint/notifications.py`) to build and send email messages.
- An email provider API key in backend environment configuration, never in browser JavaScript or Git.
- Error logging, unsubscribe controls, and duplicate prevention. For an early prototype, FastAPI background tasks could be enough; for reliable large-scale delivery, use a queue/outbox and retries.

We should not send email to every registered user by default. People need to explicitly opt in.

## Option 2 — iPhone push notifications

This is also possible without building a native iOS app. Apple supports Web Push for **Home Screen web apps on iOS 16.4+**. The user would open Buzz Bitez in Safari, add it to their Home Screen, open the installed web app, and press a button to enable notifications. iOS then asks permission. We need an HTTPS deployment for real-device testing (localhost is only useful for local development).

Our `manifest.json` already has `display: "standalone"`, which helps. We should check the deployed `start_url` and `scope`, and correct the icon path: the manifest uses `Assets/` while the folder in the ZIP is `assets/`.

### How it could work

1. The user taps **Enable push notifications** in our settings page.
2. Frontend JavaScript registers a service worker and asks for push permission directly after the tap.
3. The browser gives us a push subscription. We save its endpoint and keys in PostgreSQL, tied to the authenticated user/device.
4. After a new event is saved, FastAPI sends a notification to all opted-in subscriptions using Web Push (for example, with Python's `pywebpush`).
5. The service worker shows a notification, and tapping it opens the event in Buzz Bitez.

### What we'd add

- A service worker (for example, `service-worker.js`) handling push and notification clicks.
- An enable/disable push UI in `settings.html` and `settings.js`.
- VAPID keys: public key available to the frontend, private key stored securely on the backend.
- A `push_subscriptions` table (one student can have multiple devices).
- Authenticated subscribe/unsubscribe endpoints and a public-key endpoint.
- Logic for expired subscriptions, permission denial, and duplicate deliveries.

The existing setting called **Text notifications** is not the same as push notifications. If we aren't implementing SMS, I would rename it **Push notifications** rather than calling it text messaging.

## Where the notification trigger would go

The trigger should run **after** the backend successfully commits a new event, rather than from a browser tab. That way, it can notify all subscribed students even if they are not currently using the site.

```text
Someone submits the food broadcast form
              |
              v
Frontend POST /events (matching the API schema)
              |
              v
FastAPI validates and saves to PostgreSQL
              |
              v
Successful new event -> notification task
              |
              +--> email_enabled? -> email provider
              |
              +--> push_enabled? -> saved device subscriptions -> Web Push
```

Only new event creation should send the initial alert. Editing an event shouldn't send another alert unless we decide to add update notifications separately. If the database write fails, nothing should be sent.

## Files we'd probably touch

| File / part of the project | Why |
| --- | --- |
| `JavaScript/broadcast.js` | Fix event payload names, check API responses, and stop treating `localStorage` as the successful source of truth. |
| `JavaScript/alerts.js` | Load and render real `/events` data. |
| `JavaScript/settings.js` / `settings.html` | Read/save opt-in preferences and expose push permission controls. |
| `RESTEndpoint/RESTEndpoint.py` | Add notification routes; initiate notification work after a successful event creation. |
| `RESTEndpoint/models.py` | Add preferences and push subscription models. |
| `RESTEndpoint/crud.py` | Queries for preferences and subscriptions, plus filtering eligible recipients. |
| `RESTEndpoint/migrations/` | Use Alembic migrations for the new tables. |
| `RESTEndpoint/notifications.py` *(new)* | Email and push delivery logic. |
| `service-worker.js` *(new)* | Receive and display push notifications on installed web apps. |
| `manifest.json` | Check icon casing, URL scope, and install behavior. |

Possible endpoints (names are suggestions, not existing endpoints):

```text
GET    /me/notification-preferences
PATCH  /me/notification-preferences
GET    /push/vapid-public-key
POST   /me/push-subscriptions
DELETE /me/push-subscriptions/{subscription_id}
```

The `/me` routes should use a verified logged-in account. We should not let one user change another user's notification settings.

## Suggested implementation order

1. Fix `broadcast.js` / `POST /events` mismatch and error handling.
2. Update `alerts.js` to display events from `GET /events`.
3. Improve authentication and persist notification preferences in PostgreSQL with Alembic.
4. Prototype sending one email from FastAPI; then trigger it for a newly created event with an opted-in test account.
5. Add a service worker, VAPID key support, and subscription endpoints for Web Push.
6. Deploy over HTTPS and test the installed app on a real iPhone.
7. Add unsubscribe handling, failure logs, retry strategy, and protections against sending duplicate alerts.


## References

- [Apple Developer — Sending Web Push Notifications](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers)
- [WebKit — Web Push for Web Apps on iOS and iPadOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [Resend — Send emails with FastAPI](https://resend.com/fastapi)
- [Resend — Python SDK async support](https://resend.com/changelog/python-sdk-async-support)
- [MDN — Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [pywebpush](https://github.com/web-push-libs/pywebpush)
