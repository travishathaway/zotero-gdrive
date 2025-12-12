/**
 * Google OAuth Manager
 * Pure browser-based OAuth 2.0 implementation
 * No external dependencies - uses only native APIs and Zotero's built-in modules
 */

import type { OAuthTokens } from "../../types/interfaces";

// Import credentials (user must create this file from template)
// @ts-ignore - credentials.ts is gitignored, may not exist during development
import { GOOGLE_OAUTH_CONFIG } from "../../config/credentials";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export class GoogleOAuthManager {
  private readonly PREF_ACCESS_TOKEN =
    "extensions.zotero.gdrivesync.accessToken";
  private readonly PREF_REFRESH_TOKEN =
    "extensions.zotero.gdrivesync.refreshToken";
  private readonly PREF_EXPIRY_DATE =
    "extensions.zotero.gdrivesync.expiryDate";

  constructor() {
    // No initialization needed - all state is in preferences
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const tokens = this.getStoredTokens();
    if (!tokens || !tokens.refresh_token) {
      return false;
    }

    // Check if access token is still valid
    if (tokens.expiry_date && tokens.expiry_date > Date.now()) {
      return true;
    }

    // Try to refresh the access token
    try {
      await this.refreshAccessToken();
      return true;
    } catch (error) {
      ztoolkit.log("Failed to refresh access token:", error);
      return false;
    }
  }

  /**
   * Start OAuth authentication flow
   * Opens browser for user to authenticate and authorize
   */
  async authenticate(): Promise<boolean> {
    try {
      // Generate authorization URL
      const authUrl = this.generateAuthUrl();

      // Show instructions to user
      const instructions = new ztoolkit.ProgressWindow("Google Drive Authentication", {
        closeOnClick: false,
        closeTime: -1,
      })
        .createLine({
          text: "Opening browser for authentication...",
          type: "default",
        })
        .createLine({
          text: "After authorizing, you may see 'Request not allowed'",
          type: "default",
        })
        .createLine({
          text: "If so, look for the authorization code in the URL or on the page",
          type: "default",
        })
        .show();

      // Open browser for user to authenticate
      ztoolkit.log("Opening authentication URL:", authUrl);
      Zotero.launchURL(authUrl);

      // Try to receive callback via Zotero.Server (with short timeout)
      const code = await Promise.race([
        this.startCallbackServer(),
        new Promise<string | null>((resolve) =>
          setTimeout(() => {
            ztoolkit.log("Server callback timed out, falling back to manual entry");
            resolve(null);
          }, 10000),
        ), // 10 second timeout
      ]);

      instructions.close();

      let authCode = code;

      // If server callback failed, prompt user to enter code manually
      if (!authCode) {
        ztoolkit.log("Prompting user for manual code entry");

        authCode = await this.promptForAuthCode();

        if (!authCode) {
          throw new Error("No authorization code provided");
        }
      }

      // Exchange authorization code for tokens
      const tokens = await this.exchangeCodeForTokens(authCode);

      // Store tokens
      this.storeTokens(tokens);

      ztoolkit.log("Authentication successful!");
      return true;
    } catch (error) {
      ztoolkit.log("Authentication failed:", error);
      throw error;
    }
  }

  /**
   * Prompt user to manually enter the authorization code
   * Used as fallback when Zotero.Server callback fails
   */
  private async promptForAuthCode(): Promise<string | null> {
    const extraData = { value: "" };

    const win = Zotero.getMainWindow();

    const result = Services.prompt.prompt(
      win as any,
      "Google Drive Authorization",
      "The automatic callback failed. Please copy the authorization code from your browser.\n\n" +
        "Look for:\n" +
        "1. A code in the URL (after 'code='), OR\n" +
        "2. A code displayed on the Google page\n\n" +
        "Paste the code below:",
      extraData,
      "",
      { value: false },
    );

    if (result && extraData.value) {
      return extraData.value.trim();
    }

    return null;
  }

  /**
   * Generate OAuth authorization URL
   */
  private generateAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: GOOGLE_OAUTH_CONFIG.CLIENT_ID,
      redirect_uri: GOOGLE_OAUTH_CONFIG.REDIRECT_URI,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/drive.file",
      access_type: "offline",
      prompt: "consent",
    });

    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access and refresh tokens
   */
  private async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    const params = new URLSearchParams({
      code,
      client_id: GOOGLE_OAUTH_CONFIG.CLIENT_ID,
      client_secret: GOOGLE_OAUTH_CONFIG.CLIENT_SECRET,
      redirect_uri: GOOGLE_OAUTH_CONFIG.REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${response.statusText} - ${errorText}`);
    }

    const data: any = await response.json();

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expiry_date: Date.now() + (data.expires_in * 1000),
      token_type: data.token_type,
    };
  }

  /**
   * Start OAuth callback endpoint using Zotero's built-in HTTP server
   * Registers a temporary endpoint on Zotero.Server (port 23119)
   */
  private async startCallbackServer(): Promise<string | null> {
    return new Promise((resolve) => {
      // Store resolve function so endpoint can access it
      let callbackResolve = resolve;
      let timeoutId: any;

      // Create endpoint handler
      const endpoint = function () {};
      endpoint.prototype = {
        supportedMethods: ["GET"],

        init: function (data: any) {
          try {
            // Parse query parameters from data string
            const params = new URLSearchParams(data);
            const code = params.get("code");
            const error = params.get("error");

            // Clear timeout
            if (timeoutId) {
              clearTimeout(timeoutId);
            }

            // Clean up endpoint
            delete Zotero.Server.Endpoints["/oauth2callback"];

            if (code) {
              ztoolkit.log("OAuth callback received with code");
              callbackResolve(code);

              return [
                200,
                "text/html",
                `
                <html>
                  <head><title>Authentication Successful</title></head>
                  <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: #4CAF50;">✓ Authentication Successful!</h1>
                    <p>You can close this window and return to Zotero.</p>
                    <script>setTimeout(() => window.close(), 2000);</script>
                  </body>
                </html>
              `,
              ];
            } else if (error) {
              ztoolkit.log("OAuth callback error:", error);
              callbackResolve(null);

              return [
                400,
                "text/html",
                `
                <html>
                  <head><title>Authentication Failed</title></head>
                  <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: #f44336;">✗ Authentication Failed</h1>
                    <p>Error: ${error}</p>
                    <p>You can close this window.</p>
                  </body>
                </html>
              `,
              ];
            }

            // No code or error - unexpected
            callbackResolve(null);
            return [400, "text/html", "<h1>Invalid callback</h1>"];
          } catch (err) {
            ztoolkit.log("Error handling OAuth callback:", err);
            callbackResolve(null);
            return [500, "text/html", "<h1>Server error</h1>"];
          }
        },
      };

      // Register endpoint
      Zotero.Server.Endpoints["/oauth2callback"] = endpoint;

      // Ensure Zotero's server is running
      if (!(Zotero.Server as any)._running) {
        try {
          (Zotero.Server as any).init();
        } catch (error) {
          ztoolkit.log("Failed to start Zotero.Server:", error);
          delete Zotero.Server.Endpoints["/oauth2callback"];
          resolve(null);
          return;
        }
      }

      ztoolkit.log(
        "OAuth callback endpoint registered on http://127.0.0.1:23119/oauth2callback",
      );

      // Timeout after 5 minutes
      timeoutId = setTimeout(() => {
        ztoolkit.log("OAuth callback timed out");
        delete Zotero.Server.Endpoints["/oauth2callback"];
        resolve(null);
      }, 5 * 60 * 1000);
    });
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    const tokens = this.getStoredTokens();
    if (!tokens || !tokens.refresh_token) {
      throw new Error("No refresh token available");
    }

    const params = new URLSearchParams({
      client_id: GOOGLE_OAUTH_CONFIG.CLIENT_ID,
      client_secret: GOOGLE_OAUTH_CONFIG.CLIENT_SECRET,
      refresh_token: tokens.refresh_token,
      grant_type: "refresh_token",
    });

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed: ${response.statusText} - ${errorText}`);
    }

    const data: any = await response.json();

    const newTokens: OAuthTokens = {
      access_token: data.access_token,
      refresh_token: tokens.refresh_token, // Keep existing refresh token
      expiry_date: Date.now() + (data.expires_in * 1000),
      token_type: data.token_type,
    };

    this.storeTokens(newTokens);
    ztoolkit.log("Access token refreshed");
  }

  /**
   * Get access token for API calls
   */
  async getAccessToken(): Promise<string> {
    // Check if authenticated
    if (!(await this.isAuthenticated())) {
      throw new Error("Not authenticated. Please authenticate first.");
    }

    const tokens = this.getStoredTokens();
    if (!tokens || !tokens.access_token) {
      throw new Error("No access token available");
    }

    return tokens.access_token;
  }

  /**
   * Store OAuth tokens in Zotero preferences
   * Note: For MVP, using simple storage. In production, should encrypt tokens.
   */
  private storeTokens(tokens: OAuthTokens): void {
    if (tokens.access_token) {
      Zotero.Prefs.set(this.PREF_ACCESS_TOKEN, tokens.access_token, true);
    }
    if (tokens.refresh_token) {
      Zotero.Prefs.set(this.PREF_REFRESH_TOKEN, tokens.refresh_token, true);
    }
    if (tokens.expiry_date) {
      Zotero.Prefs.set(
        this.PREF_EXPIRY_DATE,
        tokens.expiry_date.toString(),
        true,
      );
    }
  }

  /**
   * Get stored tokens from preferences
   */
  private getStoredTokens(): OAuthTokens | null {
    const access_token = Zotero.Prefs.get(
      this.PREF_ACCESS_TOKEN,
      true,
    ) as string;
    const refresh_token = Zotero.Prefs.get(
      this.PREF_REFRESH_TOKEN,
      true,
    ) as string;
    const expiry_date_str = Zotero.Prefs.get(
      this.PREF_EXPIRY_DATE,
      true,
    ) as string;

    if (!access_token) {
      return null;
    }

    return {
      access_token,
      refresh_token,
      expiry_date: expiry_date_str ? parseInt(expiry_date_str) : undefined,
    };
  }

  /**
   * Clear stored tokens (for logout/reset)
   */
  clearTokens(): void {
    Zotero.Prefs.clear(this.PREF_ACCESS_TOKEN, true);
    Zotero.Prefs.clear(this.PREF_REFRESH_TOKEN, true);
    Zotero.Prefs.clear(this.PREF_EXPIRY_DATE, true);
  }
}
