import { ClientSDK } from "@sitecore-marketplace-sdk/client";

export async function getContextId(client: ClientSDK | null): Promise<string | null> {
    try {

        const application = await client?.query("application.context");
        const sitecoreContextId = application?.data?.resources?.[0]?.context?.preview;

        if (!sitecoreContextId) {
            throw new Error("Failed to get sitecore context ID");
        }

        return sitecoreContextId;
    } catch (error) {
        console.error("Failed to get sitecore context ID:", error);
        return null;
    }
}