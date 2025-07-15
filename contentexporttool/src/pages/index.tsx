
import { useMarketplaceClient } from "@/utils/hooks/useMarketplaceClient";
import { useState, useEffect } from "react";
import sitecoreTheme, { toastOptions } from '@sitecore/blok-theme'
import { ChakraProvider } from "@chakra-ui/react";
import { ExportTool } from "@/components/ContentExport";
import { TabsContent, TabsList, TabsTrigger, Tabs } from "@/ui/tabs";
import { ImportTool } from "@/components/ContentImport";

export default function Home() {

  const { client, error, isInitialized } = useMarketplaceClient();
  const [applicationContext, setApplicationContext] = useState({ id: '', url: '' });

  useEffect(() => {
    if (!error && isInitialized && client) {
      console.log("Marketplace client initialized successfully.");
      // Make a query to retrieve the application context
      client.query("application.context")
        .then((appContextResponse) => {
          console.log("Success retrieving application.context:", appContextResponse.data);
          if (appContextResponse?.data) {
            setApplicationContext(appContextResponse.data);
          } else {
            setApplicationContext({ id: '', url: '' });
            console.warn('Application context data not found in response:', appContextResponse);
          }
        })
        .catch((error) => {
          console.error("Error retrieving application.context:", error);
        });

    } else if (error) {
      console.error("Error initializing Marketplace client:", error);
    }
  }, [client, error, isInitialized]);

  return (
    <>
      <ChakraProvider theme={sitecoreTheme} toastOptions={toastOptions}>
        <div className="container mx-auto py-6 px-4">
          <div className="border bg-card text-card-foreground shadow-sm">

            <Tabs defaultValue={'export'} className="w-full">
              <TabsList className="grid w-full grid-cols-2 border-b border-border">
                <TabsTrigger value="export" className="">
                  Export
                </TabsTrigger>
                <TabsTrigger value="import" className="">
                  Import
                </TabsTrigger>
              </TabsList>

              <TabsContent value="export">
                <ExportTool appContext={applicationContext} client={client} />
              </TabsContent>
              <TabsContent value="import">
                <ImportTool appContext={applicationContext} client={client} />
              </TabsContent>
            </Tabs>

          </div>
        </div>
      </ChakraProvider>
    </>
  );
}
