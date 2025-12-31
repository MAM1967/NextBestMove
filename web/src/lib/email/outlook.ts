import type { EmailProvider } from "./providers";
import { getEmailAccessToken } from "./tokens";

export interface OutlookMessage {
  id: string;
  conversationId: string;
  subject: string;
  bodyPreview: string;
  from: { emailAddress: { address: string; name: string } };
  toRecipients: Array<{ emailAddress: { address: string; name: string } }>;
  receivedDateTime: string;
  importance?: string;
  categories?: string[];
}

export interface OutlookMessageListResponse {
  value: OutlookMessage[];
  "@odata.nextLink"?: string;
}

/**
 * Fetch recent messages from Microsoft Graph API
 */
export async function fetchOutlookMessages(
  userId: string,
  top: number = 50
): Promise<OutlookMessage[]> {
  console.log(`[Outlook Fetch] Starting fetch for user ${userId}, top: ${top}`);
  const accessToken = await getEmailAccessToken(userId, "outlook");
  if (!accessToken) {
    console.error(`[Outlook Fetch] No valid access token for Outlook (user: ${userId})`);
    throw new Error("No valid access token for Outlook");
  }
  console.log(`[Outlook Fetch] Access token obtained successfully`);

  // Fetch emails from last 90 days (1 quarter) to capture less frequent relationships
  // Relationships represent <5% of email volume, so we need to go back further
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const dateFilter = ninetyDaysAgo.toISOString();
  
  /**
   * Fetch messages with exponential backoff retry
   * Based on Microsoft Graph API official limits:
   * - 10,000 API requests per 10-minute period per user/mailbox per app ID
   * - 4 concurrent requests per mailbox maximum
   * - Since we fetch all messages in a single request, no rate limiting needed between requests
   * - Exponential backoff handles 429 errors with Retry-After header support
   * Reference: https://learn.microsoft.com/en-us/graph/throttling
   */
  async function fetchWithRetry(
    url: string,
    maxRetries: number = 3
  ): Promise<Response> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        return response;
      }

      // Handle rate limiting (429) with exponential backoff
      if (response.status === 429) {
        // Check for Retry-After header
        const retryAfter = response.headers.get("Retry-After");
        // Also check Microsoft-specific headers
        const retryAfterMs = response.headers.get("Retry-After-Milliseconds");
        const waitTime = retryAfterMs
          ? parseInt(retryAfterMs, 10)
          : retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : Math.min(1000 * Math.pow(2, attempt), 8000); // Exponential backoff: 1s, 2s, 4s, max 8s
        
        if (attempt < maxRetries - 1) {
          console.warn(`Outlook rate limited, retrying after ${waitTime}ms (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }

      // Other errors - throw
      if (attempt === maxRetries - 1) {
        throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
      }
    }

    throw new Error("Failed to fetch Outlook messages after retries");
  }

  const graphUrl = new URL("https://graph.microsoft.com/v1.0/me/messages");
  graphUrl.searchParams.set("$top", top.toString());
  graphUrl.searchParams.set("$select", "id,conversationId,subject,bodyPreview,from,toRecipients,receivedDateTime,importance,categories");
  graphUrl.searchParams.set("$orderby", "receivedDateTime desc");
  graphUrl.searchParams.set("$filter", `receivedDateTime ge ${dateFilter}`); // Get messages from last 90 days

  const response = await fetchWithRetry(graphUrl.toString());
  const data: OutlookMessageListResponse = await response.json();
  const messages = data.value || [];
  console.log(`[Outlook Fetch] Found ${messages.length} messages from last 90 days`);
  return messages;
}

/**
 * Extract email metadata from Outlook message
 */
export function extractOutlookMetadata(message: OutlookMessage) {
  return {
    messageId: message.id,
    threadId: message.conversationId,
    from: message.from?.emailAddress?.address || "",
    to: message.toRecipients?.[0]?.emailAddress?.address || "",
    subject: message.subject || "",
    snippet: message.bodyPreview || "",
    receivedAt: message.receivedDateTime,
    importance: message.importance,
    categories: message.categories || [],
  };
}




