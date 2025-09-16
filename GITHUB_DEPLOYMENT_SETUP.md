# GitHub Pages Deployment with Secrets

This guide explains how to set up automated deployment to GitHub Pages with secure API key handling.

## Step 1: Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

### Required Secrets:
- **Name**: `REACT_APP_OPENAI_API_KEY`
- **Value**: `[Your OpenAI API key here]`

## Step 2: Enable GitHub Pages

1. Go to **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Save the settings

## Step 3: Enable Workflow Permissions

1. Go to **Settings** → **Actions** → **General**
2. Under **Workflow permissions**, select **Read and write permissions**
3. Check **Allow GitHub Actions to create and approve pull requests**
4. Save

## Step 4: Deploy

The deployment will now happen automatically when you:
- Push to the `main` branch
- Or manually trigger it from **Actions** tab → **Deploy to GitHub Pages** → **Run workflow**

## How It Works

1. **GitHub Actions** runs when you push to main
2. **Builds** your React app with the secret API key
3. **Deploys** the built files to GitHub Pages
4. **Your live site** will have the AI suggestions working

## Monitoring

- Check the **Actions** tab to see deployment status
- Your site will be available at: `https://[username].github.io/[repository-name]`
- Build logs will show any errors

## Security Notes

- API key is stored securely in GitHub Secrets
- Never visible in your source code or build logs
- Only accessible during the build process
- Can be rotated by updating the secret value
