# Place History Explorer + OpenAI API

This is your existing Place History Explorer HTML updated to call OpenAI through a Netlify Function. The API key is stored in Netlify environment variables, not in the browser.

## Files
- `index.html` — your website, with the existing interface and AI calls updated.
- `netlify/functions/ask.mjs` — secure server-side API proxy.
- `netlify.toml` — tells Netlify where the site and function are.

## Deploy
1. Extract this ZIP to a folder.
2. In Netlify, create a new site by importing the folder from a Git repository, or use Netlify CLI. The simplest repeatable route is GitHub: upload these files to a new repository and choose that repository in Netlify.
3. In Netlify, open **Project configuration → Environment variables**. Add `OPENAI_API_KEY` with your secret key. Optionally add `OPENAI_MODEL` with a model available to your API account; default is `gpt-4.1-mini`.
4. Redeploy after adding the variable.
5. Open your site and test a place such as Chennai.

## Important cost note
ChatGPT Free and OpenAI API usage have separate billing. API calls may require billing/credits; this project does not make API usage free. Do not add a payment method if you cannot accept any charges. If your API account has no usable credits, real AI requests will fail.

## Security
Never paste your secret API key into `index.html`, public GitHub files, screenshots, or chat. If a key is exposed, revoke it and create another.

## Local preview
Opening `index.html` directly will display the interface, but the serverless function will not run just by double-clicking the file. Deploy through Netlify or run the Netlify CLI locally to test the AI connection.
