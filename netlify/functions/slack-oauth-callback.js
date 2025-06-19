exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }

  const { code, error } = event.queryStringParameters || {};

  if (error) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/html' },
      body: `
        <html>
          <body>
            <h1>Installation Failed</h1>
            <p>Error: ${error}</p>
          </body>
        </html>
      `
    };
  }

  if (!code) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/html' },
      body: `
        <html>
          <body>
            <h1>Error</h1>
            <p>No authorization code received</p>
          </body>
        </html>
      `
    };
  }

  try {
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code: code
      })
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.ok) {
      console.error('OAuth exchange failed:', tokenData);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'text/html' },
        body: `
          <html>
            <body>
              <h1>Installation Failed</h1>
              <p>Failed to exchange code for token: ${tokenData.error}</p>
            </body>
          </html>
        `
      };
    }

    // Log installation details with FULL token
    console.log('Installation successful for team:', tokenData.team?.name);
    console.log('Full access_token:', tokenData.access_token);
    console.log('Bot user ID:', tokenData.bot_user_id);
    console.log('Team ID:', tokenData.team?.id);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
            <h1>🎉 Slack App Successfully Installed!</h1>
            <p><strong>Team:</strong> ${tokenData.team?.name}</p>
            <p><strong>Bot User ID:</strong> ${tokenData.bot_user_id}</p>
            <p>Your app has been successfully installed and configured.</p>
            <p><em>The access token has been logged securely for configuration purposes.</em></p>
          </body>
        </html>
      `
    };

  } catch (error) {
    console.error('Error during OAuth exchange:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html' },
      body: `
        <html>
          <body>
            <h1>Server Error</h1>
            <p>Something went wrong during installation</p>
          </body>
        </html>
      `
    };
  }
};
