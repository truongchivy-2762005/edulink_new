/**
 * Open Campus ID (OCID) Connect Library & Sandbox Fallback Module
 */

export const OCID_SANDBOX_AUTH_URL =
  process.env.NEXT_PUBLIC_OCID_SANDBOX_URL || "https://id.sandbox.opencampus.xyz";

export const OCID_CLIENT_ID =
  process.env.NEXT_PUBLIC_OCID_CLIENT_ID || "edulink_hub_sandbox_client";

export interface OCIDProfile {
  ocid: string;
  ocid_username: string;
  eth_address?: string;
  id_token?: string;
}

/**
 * Generate Open Campus ID Sandbox OAuth2 Authorization URL
 */
export function getOCIDConnectUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: OCID_CLIENT_ID,
    response_type: "code",
    scope: "openid profile edu",
    redirect_uri: redirectUri,
    state: "ocid_connect_" + Math.random().toString(36).substring(7),
  });

  return `${OCID_SANDBOX_AUTH_URL}?${params.toString()}`;
}

/**
 * Generate Sandbox Mock OCID Profile for offline / fallback demo
 */
export function generateMockOCID(userName: string): OCIDProfile {
  const cleanName = userName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

  const randomHash = Math.random().toString(36).substring(2, 6);
  const ocidUsername = `${cleanName || "student"}_${randomHash}`;
  const ocid = `ocid.${ocidUsername}.edu`;

  return {
    ocid,
    ocid_username: ocidUsername,
    eth_address: "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    id_token: "mock_ocid_id_token_" + Date.now(),
  };
}
