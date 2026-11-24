# Orbit AI — AI Hub

A responsive browser-based AI workspace. It can discover and chat with models currently marked free on OpenRouter, and compare up to three model responses.

## Run it
1. Extract this ZIP.
2. Open `index.html` in a modern browser, or publish the folder with GitHub Pages.
3. Open **Settings → Get an API key** and create an OpenRouter account/key.
4. Paste the key into Settings and save.
5. Choose a model and start chatting.

## Important notes
- The app does not make every AI provider free. It lists OpenRouter models tagged `:free` at the time you refresh.
- Free model availability, rate limits, queues, and terms can change. Some models may require credits.
- The API key is stored in this browser's local storage and sent directly from the browser to OpenRouter. Do not use this on a shared/public device. For a public multi-user product, use a secure server-side API proxy and never expose a shared secret in frontend code.
- This starter app has no account system or cloud chat history.
- For local testing, opening `index.html` may work directly. If browser restrictions interfere, serve the folder with a local static server.
