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
  const accessToken = await getEmailAccessToken(userId, "outlook");
  if (!accessToken) {
    throw new Error("No valid access token for Outlook");
  }

  // Fetch emails from last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateFilter = thirtyDaysAgo.toISOString();
  
  const graphUrl = new URL("https://graph.microsoft.com/v1.0/me/messages");
  graphUrl.searchParams.set("$top", top.toString());
  graphUrl.searchParams.set("$select", "id,conversationId,subject,bodyPreview,from,toRecipients,receivedDateTime,importance,categories");
  graphUrl.searchParams.set("$orderby", "receivedDateTime desc");
  graphUrl.searchParams.set("$filter", `receivedDateTime ge ${dateFilter}`); // Get messages from last 30 days

  const response = await fetch(graphUrl.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Microsoft Graph API error: ${response.statusText}`);
  }

  const data: OutlookMessageListResponse = await response.json();
  return data.value || [];
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




