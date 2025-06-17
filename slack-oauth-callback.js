// functions/slack-oauth-callback.js

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  
  // Check for OAuth errors
  if (error) {
    return new Response(createErrorPage(error), {
      headers: { 'Content-Type': 'text/html' },
      status: 400
    });
  }
  
  if (!code) {
    return new Response(createErrorPage('No authorization code received'), {
      headers: { 'Content-Type': 'text/html' },
      status: 400
    });
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: env.SLACK_CLIENT_ID,
        client_secret: env.SLACK_CLIENT_SECRET,
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.ok) {
      // Successfully got access token
      console.log('Installation successful for team:', tokenData.team.name);
      
      // Store the installation data (you'll need to implement this)
      await storeInstallationData(tokenData, env);
      
      return new Response(createSuccessPage(tokenData.team.name), {
        headers: { 'Content-Type': 'text/html' }
      });
    } else {
      console.error('Slack OAuth error:', tokenData);
      return new Response(createErrorPage(`Slack error: ${tokenData.error}`), {
        headers: { 'Content-Type': 'text/html' },
        status: 400
      });
    }
  } catch (error) {
    console.error('OAuth exchange failed:', error);
    return new Response(createErrorPage('Installation failed. Please try again.'), {
      headers: { 'Content-Type': 'text/html' },
      status: 500
    });
  }
}

async function storeInstallationData(tokenData, env) {
  // For now, just log the installation
  // You can later add storage logic here
  console.log('New installation:', {
    team_id: tokenData.team.id,
    team_name: tokenData.team.name,
    bot_user_id: tokenData.bot_user_id,
    access_token: tokenData.access_token // Store this securely!
  });
  
  // Optional: Send to a webhook or external service
  // if (env.WEBHOOK_URL) {
  //   await fetch(env.WEBHOOK_URL, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({
  //       team_id: tokenData.team.id,
  //       team_name: tokenData.team.name,
  //       access_token: tokenData.access_token,
  //       installed_at: new Date().toISOString()
  //     })
  //   });
  // }
}

function createSuccessPage(teamName) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Installation Successful</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 600px; 
          margin: 50px auto; 
          padding: 20px;
          line-height: 1.6;
          background: #f8f9fa;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          text-align: center;
        }
        .success { color: #28a745; margin-bottom: 20px; }
        .button { 
          background: #007cba; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px;
          display: inline-block;
          margin-top: 20px;
        }
        .button:hover { background: #005a8b; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="success">✅ Installation Successful!</h1>
        <p>Your <strong>Asana Sync</strong> app has been successfully installed to the <strong>${teamName}</strong> workspace.</p>
        <p>You can now use the Asana Sync shortcut in your Slack workspace.</p>
        <p>If you have any questions or need support, please contact us.</p>
        <a href="https://2qconsulting.com" class="button">Return to 2Q Consulting</a>
      </div>
    </body>
    </html>
  `;
}

function createErrorPage(errorMessage) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Installation Failed</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 600px; 
          margin: 50px auto; 
          padding: 20px;
          line-height: 1.6;
          background: #f8f9fa;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          text-align: center;
        }
        .error { color: #dc3545; margin-bottom: 20px; }
        .button { 
          background: #007cba; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px;
          display: inline-block;
          margin-top: 20px;
        }
        .button:hover { background: #005a8b; }
        code { 
          background: #f1f3f4; 
          padding: 4px 8px; 
          border-radius: 4px;
          color: #d73a49;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="error">❌ Installation Failed</h1>
        <p>There was an error installing the Asana Sync app:</p>
        <p><code>${errorMessage}</code></p>
        <p>Please try again or contact support if the problem persists.</p>
        <a href="https://2qconsulting.com" class="button">Return to 2Q Consulting</a>
      </div>
    </body>
    </html>
  `;
}
