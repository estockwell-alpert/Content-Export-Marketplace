
import { useMarketplaceClient } from "@/utils/hooks/useMarketplaceClient";
import { useState, useEffect } from "react";
import sitecoreTheme, { toastOptions } from '@sitecore/blok-theme'
import { Alert, AlertDescription, AlertIcon, ChakraProvider, Spinner } from "@chakra-ui/react";
import { ExportTool } from "@/components/ContentExport";
import { TabsContent, TabsList, TabsTrigger, Tabs } from "@/ui/tabs";
import { ImportTool } from "@/components/ContentImport";
import { GetLanguages } from "@/services/contentExportUtil";

export default function Home() {

  const { client, error, isInitialized } = useMarketplaceClient();
  const [applicationContext, setApplicationContext] = useState({ id: '', url: '' });
  const [languages, setLanguages] = useState<string[]>();

  useEffect(() => {
    if (!error && isInitialized && client) {
      console.log("Marketplace client initialized successfully.");
      // Make a query to retrieve the application context
      client.query("application.context")
        .then((appContextResponse) => {
          console.log("Success retrieving application.context:", appContextResponse.data);
          if (appContextResponse?.data) {
            setApplicationContext(appContextResponse.data);

            const getLanguagesAsync = async () => {
              if (!appContextResponse.data) return;
              const availableLanguages = await GetLanguages(appContextResponse.data, client);
              if (availableLanguages) {
                console.log(availableLanguages);
                setLanguages(availableLanguages);
                localStorage.setItem('languages', JSON.stringify(availableLanguages));
              }
            }

            const languages = localStorage.getItem('languages');
            if (languages) {
              const parsedLanguages = JSON.parse(languages) as string[];
              setLanguages(parsedLanguages);
            } else {
              getLanguagesAsync()
                // make sure to catch any error
                .catch(console.error);
            }

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

            {/* Loading Modal */}
            <div className="fixed inset-0 bg-black/50 hidden" id="loading-modal">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg">
                <div className="flex items-center justify-center">
                  <Spinner size="xl" />
                </div>
              </div>
            </div>


            <Tabs defaultValue={'export'} className="w-full">
              <TabsList className="grid w-full grid-cols-2 border-b border-border">
                <TabsTrigger value="export" className="">
                  Export
                </TabsTrigger>
                <TabsTrigger value="import" className="">
                  Import
                </TabsTrigger>
              </TabsList>

              {(client === null || applicationContext === null) && isInitialized &&
                (
                  <Alert status="error">
                    <AlertIcon />
                    <AlertDescription>Session has expired. Please refresh the page</AlertDescription>
                  </Alert>
                )
              }

              <TabsContent value="export">
                <ExportTool appContext={applicationContext} client={client} siteLanguages={languages ?? []} />
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
