export interface TwitterTokenPayload {
  id: string;
  email?: string;
  name?: string;
  username?: string;
  profile_image_url?: string;
}

export async function verifyTwitterToken(
  accessToken: string
): Promise<TwitterTokenPayload> {
  try {
    const response = await fetch(
      `https://api.twitter.com/2/users/me?user.fields=profile_image_url`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Twitter API error:", errorText);
      throw new Error("Invalid Twitter token");
    }

    const data = await response.json();
    if (!data.data) {
      throw new Error("Invalid Twitter response");
    }

    const user = data.data;
    return {
      id: user.id,
      email: undefined,
      name: user.name,
      username: user.username,
      profile_image_url: user.profile_image_url,
    };
  } catch (error) {
    console.error("Error verifying Twitter token:", error);
    throw new Error("Invalid Twitter token");
  }
}

export async function exchangeTwitterCode(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<{ access_token: string; token_type: string }> {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Twitter OAuth credentials not configured");
  }

  const params = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Twitter token exchange error:", error);
    throw new Error("Failed to exchange Twitter authorization code");
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    token_type: data.token_type,
  };
}

