# Nouh Portfolio

A personal portfolio for Nouh, a Digital Development student in Casablanca, Morocco. The site presents projects, skills, services, certificates, and contact links, with an admin area for managing portfolio content.

## Features

- Responsive portfolio with English, French, and Arabic interface options
- Projects, skills, services, and certificate sections
- Admin login for managing portfolio content, projects, certificates, and the CV
- Gemini-powered portfolio assistant
- Contact form that can deliver messages through Gmail
- Light and dark themes

## Tech Stack

- React 18
- Node.js and Express
- MySQL
- Google Gemini API
- Nodemailer for contact email

## Requirements

- Node.js and npm
- MySQL

## Local Setup

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Create a local environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Configure the values in `.env`:

   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` for MySQL
   - `JWT_SECRET` with a long, unique random value
   - `GEMINI_API_KEY` for the AI assistant
   - `GMAIL_USER` and `GMAIL_APP_PASSWORD` for contact email
   - `CONTACT_TO_EMAIL` if messages should go to a different inbox

   Never commit `.env` or share its values. `.gitignore` excludes the local environment file.

4. Create the MySQL database and ensure the application's tables are initialized. The server creates the `site_content` table automatically; the admin, project, technology, and certificate tables must also exist.

5. Start the API and React development server:

   ```powershell
   npm start
   ```

   The React app runs at `http://localhost:3000` and the API runs at `http://localhost:5000`.

6. To create or update an admin account, run:

   ```powershell
   npm run create-admin
   ```

   The script prompts for credentials; the password must be at least 12 characters.

7. To add the starter project if the projects table is empty, run:

   ```powershell
   npm run seed-projects
   ```

## Available Scripts

| Command | Description |
| --- | --- |
| `npm start` | Starts the API and React development server |
| `npm run server` | Starts only the API server |
| `npm run create-admin` | Creates or updates an admin account |
| `npm run seed-projects` | Adds starter projects when none exist |
| `npm run build` | Creates an optimized production build |

## GitHub

Repository: [atanannouh-dev/nouh-portfolio](https://github.com/atanannouh-dev/nouh-portfolio)

To publish future changes, run these commands from the project root (the folder containing `package.json`):

   ```powershell
   git status --short
   git add .
   git status --short
   ```

Review the staged files before committing. `.env`, `node_modules`, `build`, and `server/uploads` must not appear.

If the files look right, commit and push:

```powershell
git commit -m "Describe your changes"
git push
```

## Deployment Notes

This is a full-stack app. GitHub stores the source code, but GitHub Pages alone cannot run the Express API, MySQL database, Gemini integration, or Gmail delivery. Deploy the React app and API to hosting that supports the required services, and configure environment variables securely in the hosting dashboard.

Uploaded CVs, project images, and certificates are stored under `server/uploads` and are excluded from Git. Production hosting needs persistent file storage or an external file-storage service.
