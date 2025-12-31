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
  // Fetch emails from last 90 days (1 quarter) to capture less frequent relationships
  // Relationships represent <5% of email volume, so we need to go back further
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const dateFilter = ninetyDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  listUrl.searchParams.set("maxResults", maxResults.toString());
  listUrl.searchParams.set("q", `in:inbox after:${dateFilter}`); // Only inbox messages from last 90 days

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

  // Fetch full message details for each message with rate limiting
  // Gmail API has rate limits, so we batch requests with delays
  const messages: GmailMessage[] = [];
  const BATCH_SIZE = 10;
  const DELAY_MS = 100; // 100ms delay between batches
  
  for (let i = 0; i < listData.messages.length; i += BATCH_SIZE) {
    const batch = listData.messages.slice(i, i + BATCH_SIZE);
    
    const batchPromises = batch.map(async (msg) => {
      const messageUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`;
      
      const messageResponse = await fetch(messageUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!messageResponse.ok) {
        if (messageResponse.status === 429) {
          // Rate limited - wait and retry once
          await new Promise(resolve => setTimeout(resolve, 1000));
          const retryResponse = await fetch(messageUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          if (!retryResponse.ok) {
            console.error(`Failed to fetch Gmail message ${msg.id} after retry:`, retryResponse.statusText);
            return null;
          }
          return retryResponse.json() as Promise<GmailMessage>;
        }
        console.error(`Failed to fetch Gmail message ${msg.id}:`, messageResponse.statusText);
        return null;
      }

      return messageResponse.json() as Promise<GmailMessage>;
    });
    
    const batchResults = await Promise.all(batchPromises);
    messages.push(...batchResults.filter((msg): msg is GmailMessage => msg !== null));
    
    // Add delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < listData.messages.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }
  
  return messages;
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




