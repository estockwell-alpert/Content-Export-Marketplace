/* eslint-disable @typescript-eslint/no-explicit-any */
import { IContentNode } from "@/models/IContentNode";
import { stripGuid } from "@/utils/helpers";
import { Alert, AlertDescription, AlertIcon, Button, Icon } from "@chakra-ui/react";
import { Dispatch, SetStateAction, FC, useState } from "react";
import { ContentNode } from "./ContentNode";
import { ApplicationContext, ClientSDK } from "@sitecore-marketplace-sdk/client";
import { mdiClose } from "@mdi/js";

interface ContentBrowseModalProps {
  appContext: ApplicationContext | null,
  client: ClientSDK | null,
  selectNode: (e: any) => void;
  currentSelections: IContentNode[];
  setCurrentSelections: Dispatch<SetStateAction<any[]>>;
  browseContentOpen: boolean;
  setBrowseContentOpen: Dispatch<SetStateAction<boolean>>;
  startItem: string;
  setStartItem: Dispatch<SetStateAction<string>>;
  startNode: { itemId: string; name: string };
  templatesOnly?: boolean;
}

export const ContentBrowseModal: FC<ContentBrowseModalProps> = ({
  appContext,
  client,
  selectNode,
  currentSelections,
  setCurrentSelections,
  browseContentOpen,
  setBrowseContentOpen,
  startItem,
  setStartItem,
  startNode,
  templatesOnly,
}) => {

  const [errorMessage, setErrorMessage] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  const confirmSelection = () => {
    const startItems = startItem?.split(',');
    const newIds = currentSelections
      ?.map((item) => item.itemId.trim())
      .filter((newId) => !startItems.some((startId) => stripGuid(startId) === stripGuid(newId)));

    const udpatedStartItems = startItems.concat(newIds).filter((id) => id && id !== '');
    setStartItem(udpatedStartItems?.join(', '));
    setBrowseContentOpen(false);
  };

  const removeItem = (id: string) => {
    const updatedSelections = currentSelections.filter((item) => item.itemId !== id);
    setCurrentSelections(updatedSelections);
  };

  return (
    <>
      <div id="content-tree" className={'content-tree modal ' + (browseContentOpen ? 'open' : '')}>
        {error && <Alert status="error">
          <AlertIcon />
          <AlertDescription>Something went wrong: {errorMessage}</AlertDescription>
        </Alert>}
        <div className="inner">
          <div className="absolute right flex justify-end gap-2">
            <Button className="mobile" variant="outline" size="sm" onClick={() => setBrowseContentOpen(false)}>
              Close
            </Button>
          </div>
          <div className="browse-box">
            <ul>
              <ContentNode
                appContext={appContext}
                client={client}
                item={{
                  itemId: startNode.itemId,
                  name: startNode.name,
                  children: [],
                  hasChildren: true,
                  template: { name: '' },
                }}
                selectNode={selectNode}
                currentSelections={currentSelections ?? []}
                templatesOnly={templatesOnly}
                setError={setError}
                setErrorMessage={setErrorMessage}
              ></ContentNode>
            </ul>
          </div>
          <div className="selected-box">
            <div className="selected-inner">
              <div className="flex justify-between gap-2">
                <ul>
                  {currentSelections && (
                    <li>
                      <b>selected:</b> (double click to remove)
                    </li>
                  )}
                  {currentSelections &&
                    currentSelections?.map((item, index) => (
                      <li key={index}>
                        <a
                          onDoubleClick={() => removeItem(item.itemId)}
                          data-id={item.itemId}
                          data-name={item.name}
                          key={index}
                        >
                          {item.name}
                        </a>
                      </li>
                    ))}
                </ul>
                <Button className="desktop" variant="ghost" size="sm" onClick={() => setBrowseContentOpen(false)}>
                  <Icon><path d={mdiClose} /></Icon>
                </Button>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setCurrentSelections([])}>
                  Clear Selections
                </Button>
                <Button variant="solid" size="sm" onClick={confirmSelection}>
                  Confirm Selections
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
