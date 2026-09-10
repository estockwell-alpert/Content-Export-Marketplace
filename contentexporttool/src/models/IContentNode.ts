export interface IContentNode {
    itemId: string;
    path: string;
    name: string;
    children: IContentNode[];
    hasChildren: boolean;
    template: {
      name: string;
    };
  }
  