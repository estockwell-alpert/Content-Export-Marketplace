/* eslint-disable @typescript-eslint/no-explicit-any */

import { IContentNode } from '@/models/IContentNode';
import { convertStringToGuid } from '@/utils/helpers';
import React, { FC } from 'react';
import cn from 'classnames';
import { GetItemChildren } from '@/services/contentExportUtil';
import { ApplicationContext, ClientSDK } from "@sitecore-marketplace-sdk/client";

interface ContentNodeProps {
  appContext: ApplicationContext | null,
  client: ClientSDK | null,
  item: IContentNode;
  selectNode: (e: any) => void;
  currentSelections: IContentNode[];
  templatesOnly?: boolean;
}

export const ContentNode: FC<ContentNodeProps> = ({
  appContext,
  client,
  item,
  selectNode,
  currentSelections,
  templatesOnly,
}) => {
  const [children, setChildren] = React.useState([]);
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [isLoaded, setIsLoaded] = React.useState<boolean>(false);

  const toggleNode = async (e: any) => {
    if (!isLoaded) {
      const id = e.target.parentElement.getAttribute('data-id');
      const results = await GetItemChildren(appContext, client, id);
      const children = results.data.data.item.children.nodes;

      console.log(children);

      setChildren(children);
      setIsLoaded(true);
      setIsOpen(true);
    } else {
      if (isOpen) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    }
  };

  const isSelected = () => {
    const isSelected = currentSelections.some((node) => node.itemId === convertStringToGuid(item.itemId));
    return isSelected;
  };

  const isSelectable = !templatesOnly || item.template?.name === 'Template';

  return (
    <li data-name={item.name} data-id={item.itemId}>
      {item.hasChildren && (!templatesOnly || !isSelectable) && (
        <a className="browse-expand" onClick={(e) => toggleNode(e)}>
          {isOpen ? '-' : '+'}
        </a>
      )}
      <a
        className={cn('sitecore-node', isSelected() ? 'selected' : '', !isSelectable ? 'not-selectable' : '')}
        onDoubleClick={(e) => selectNode(e)}
      >
        {item.name}
      </a>

      <ul id={item.itemId} className={isOpen ? 'open' : ''}>
        {children &&
          children.map((child, index) => (
            <ContentNode
              appContext={appContext}
              client={client}
              key={index}
              item={child}
              selectNode={selectNode}
              currentSelections={currentSelections}
              templatesOnly={templatesOnly}
            ></ContentNode>
          ))}
      </ul>
    </li>
  );
};
