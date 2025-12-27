import type { EmailProvider } from "./providers";
import { getEmailAccessToken } from "./tokens";

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    parts?: Array<{
      mimeType: string;
      body: { data?: string };
      parts?: Array<{ mimeType: string; body: { data?: string } }>;
    }>;
  };
  internalDate: string;
}

export interface GmailMessageListResponse {
  messages: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
}

/**
 * Fetch recent messages from Gmail API
 */
export async function fetchGmailMessages(
  userId: string,
  maxResults: number = 50
): Promise<GmailMessage[]> {
  const accessToken = await getEmailAccessToken(userId, "gmail");
  if (!accessToken) {
    throw new Error("No valid access token for Gmail");
  }

  // First, get list of message IDs
  const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  listUrl.searchParams.set("maxResults", maxResults.toString());
  listUrl.searchParams.set("q", "in:inbox"); // Only inbox messages

  const listResponse = await fetch(listUrl.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!listResponse.ok) {
    throw new Error(`Gmail API error: ${listResponse.statusText}`);
  }

  const listData: GmailMessageListResponse = await listResponse.json();

  if (!listData.messages || listData.messages.length === 0) {
    return [];
  }

  // Fetch full message details for each message
  const messagePromises = listData.messages.map(async (msg) => {
    const messageUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`;
    
    const messageResponse = await fetch(messageUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!messageResponse.ok) {
      console.error(`Failed to fetch Gmail message ${msg.id}:`, messageResponse.statusText);
      return null;
    }

    return messageResponse.json() as Promise<GmailMessage>;
  });

  const messages = await Promise.all(messagePromises);
  return messages.filter((msg): msg is GmailMessage => msg !== null);
}

/**
 * Extract email metadata from Gmail message
 */
export function extractGmailMetadata(message: GmailMessage) {
  const headers = message.payload.headers || [];
  const getHeader = (name: string) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

  const from = getHeader("From");
  const to = getHeader("To");
  const subject = getHeader("Subject");
  const date = getHeader("Date");

  return {
    messageId: message.id,
    threadId: message.threadId,
    from,
    to,
    subject,
    snippet: message.snippet || "",
    receivedAt: date ? new Date(date).toISOString() : new Date(message.internalDate).toISOString(),
  };
}




