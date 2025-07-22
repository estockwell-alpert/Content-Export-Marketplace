
import { Button } from "@chakra-ui/react";
import { Dispatch, SetStateAction, FC } from "react";

interface FieldBrowseModalProps {
  availableFields: string[];
  browseContentOpen: boolean;
  setBrowseContentOpen: Dispatch<SetStateAction<boolean>>;
  fields: string | undefined;
  setFields: Dispatch<SetStateAction<string | undefined>>;
}

export const FieldBrowseModal: FC<FieldBrowseModalProps> = ({
  availableFields,
  browseContentOpen,
  setBrowseContentOpen,
  fields,
  setFields
}) => {

  const addOrRemoveItem = (name: string) => {
    if (fieldIsSelected(name)) {
      removeItem(name);
    } else {
      addField(name);
    }
  }

  const removeItem = (name: string) => {
    const updatedSelections = fields?.split(',').filter((field) => field !== name);
    setFields(updatedSelections?.join(', ') ?? '');
  };

  const fieldIsSelected = (field: string): boolean => {
    const currentFields = fields?.split(',').map((x) => x.trim());

    return currentFields?.includes(field) ?? false;
  };

  const addField = (field: string) => {
    if (fieldIsSelected(field)) return;

    if (fields) {
      setFields(fields + ', ' + field);
    } else {
      setFields(field);
    }
  };

  return (
    <>
      <div id="content-tree" className={'content-tree modal ' + (browseContentOpen ? 'open' : '')}>
        <div className="inner">
          <div className="browse-box">
            <ul>
              {availableFields && availableFields.length > 0 && (
                <div className="mt-4 space-y-2">
                  <label className="text-sm font-medium">Available Fields</label>{' '}
                  <Button variant="outline" size="sm" onClick={() => setFields(availableFields.join(', '))}>
                    Select All
                  </Button>
                  <div className="items-center gap-2 mt-4 fieldsList">
                    {availableFields &&
                      availableFields.map((field, index) => (
                        <p key={index}>
                          <a
                            className={fieldIsSelected(field) ? 'disabled' : ''}
                            onDoubleClick={() => addOrRemoveItem(field)}
                          >
                            {field}
                          </a>
                        </p>
                      ))}
                  </div>
                </div>
              )}
            </ul>
          </div>
          <div className="selected-box">
            <Button variant="ghost" size="sm" onClick={() => setBrowseContentOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
