# Security Policy

MOOSE is a client-side web app. There is no server, no account system and no analytics. Your songs and settings stay in your browser's storage on your own device.

## Supported version

Only the latest version on the `main` branch (and the live site) is supported.

## Reporting a vulnerability

Please do **not** open a public issue for security problems.

1. Open the **Security** tab of this repository.
2. Click **Report a vulnerability** to send a private report.

Please include what you found, the steps to reproduce it, and the device and browser you used. This is a personal project, so replies are best effort, but every report is read.

## Scope

In scope: problems that could run untrusted code in the app, expose a user's stored songs or settings, or break the offline cache (service worker).

Out of scope: the look of the Android notification and lock-screen card (drawn by the system), and issues in Chrome or Android themselves.
