export interface FacebookTokenPayload {
  id: string;
  email?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  picture?: {
    data?: {
      url?: string;
    };
  };
}

export async function verifyFacebookToken(
  accessToken: string
): Promise<FacebookTokenPayload> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/me?fields=id,email,name,first_name,last_name,picture&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error("Invalid Facebook token");
    }

    const data = await response.json();

    const debugResponse = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`
    );

    if (!debugResponse.ok) {
      throw new Error("Failed to verify Facebook token");
    }

    const debugData = await debugResponse.json();
    if (!debugData.data || !debugData.data.is_valid || debugData.data.app_id !== process.env.FACEBOOK_APP_ID) {
      throw new Error("Invalid Facebook token");
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      first_name: data.first_name,
      last_name: data.last_name,
      picture: data.picture,
    };
  } catch (error) {
    console.error("Error verifying Facebook token:", error);
    throw new Error("Invalid Facebook token");
  }
}
