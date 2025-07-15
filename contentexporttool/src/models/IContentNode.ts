export interface IContentNode {
    itemId: string;
    name: string;
    children: IContentNode[];
    hasChildren: boolean;
    template: {
      name: string;
    };
  }
  