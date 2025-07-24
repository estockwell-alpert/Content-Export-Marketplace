import { EdgeItemQueryTemplate, AuthoringPathFragment, AuthoringTemplatesFragment, AuthoringLangFragment, AuthoringSearchQueryTemplate, EdgeLangFragment, EdgeSearchQueryTemplate, SchemaQueryTemplate, AllFieldsFragment } from "@/templates/searchQueryTemplate";

export const GetEdgeItemQuery = (itemId: string, language: string): string => {
  const query = EdgeItemQueryTemplate.replace('[ID]', itemId).replace('[LANG]', language);
  return query;
};

// NOTE: Authoring Query only currently supports ONE path and template until I figure out how to do AND(OR)
export const GetSearchQuery = (
  startItems?: string,
  templates?: string,
  fields?: string,
  languages?: string,
  cursor?: string,
  allFields?: boolean
): string => {
  let pathFragment = '';
  if (startItems) {
    const paths = startItems.split(',');
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i].trim().toLowerCase().replaceAll('{', '').replaceAll('}', '').replaceAll('-', '');
      pathFragment += AuthoringPathFragment.replace('GUID', path);
    }
  }

  let templateFragment = '';
  if (templates) {
    const templateStrings = templates.split(',');
    for (let i = 0; i < templateStrings.length; i++) {
      const template = templateStrings[i]
        .trim()
        .toLowerCase()
        .replaceAll('{', '')
        .replaceAll('}', '')
        .replaceAll('-', '');
      templateFragment += AuthoringTemplatesFragment.replace('GUID', template);
    }
  }

  let langFragment = '';
  if (languages) {
    const langs = languages.split(',');
    for (let i = 0; i < langs.length; i++) {
      const lang = langs[i].trim().toLowerCase();
      langFragment += AuthoringLangFragment.replace('CODE', lang);
    }
  }

  const fieldsFragment = allFields ? AllFieldsFragment : getFieldsFragment(fields);

  const query = AuthoringSearchQueryTemplate.replace('pathsFragment', pathFragment)
    .replace('templatesFragment', templateFragment)
    .replace('fieldsFragment', fieldsFragment)
    .replace('langFragment', langFragment)
    .replace('afterFragment', cursor ? 'after: "' + cursor + '"' : '');

  console.log(query);

  return query;
};

export const GetEdgeQuery = (
  startItems?: string,
  templates?: string,
  fields?: string,
  languages?: string,
  cursor?: string
): string => {
  let pathFragment = '';
  if (startItems) {
    const paths = startItems.split(',');
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i].trim();
      pathFragment +=
        `{
              name: "_path"
              value: "` +
        path +
        `"
              operator: CONTAINS
          }`;
    }
  }

  let templateFragment = '';
  if (templates) {
    const templateStrings = templates.split(',');
    for (let i = 0; i < templateStrings.length; i++) {
      const template = templateStrings[i].trim();
      templateFragment +=
        `{
              name: "_templates"
              value: "` +
        template +
        `"
              operator: CONTAINS
            }`;
    }
  }

  const fieldsFragment = getFieldsFragment(fields);

  let langFragment = '';
  if (languages) {
    const langs = languages.split(',');
    for (let i = 0; i < langs.length; i++) {
      const lang = langs[i].trim().toLowerCase();
      langFragment += EdgeLangFragment.replace('CODE', lang);
    }
  }

  const query = EdgeSearchQueryTemplate.replace('pathsFragment', pathFragment)
    .replace('templatesFragment', templateFragment)
    .replace('fieldsFragment', fieldsFragment)
    .replace('langFragment', langFragment)
    .replace('afterFragment', cursor ? 'after: "' + cursor + '"' : '');

  return query;
};

export const getFieldsFragment = (fields?: string): string => {
  let fieldsFragment = '';
  if (fields) {
    const fieldStrings = fields.split(',');
    for (let i = 0; i < fieldStrings.length; i++) {
      const field = fieldStrings[i].trim();
      if (
        field.toLocaleLowerCase() === 'id' ||
        field.toLocaleLowerCase() === 'name' ||
        field.toLocaleLowerCase() === 'url' ||
        field.toLocaleLowerCase() === 'item name' ||
        field === ''
      ) {
        continue;
      }

      const fieldName = field.replaceAll(' ', '').replaceAll('__', '');

      fieldsFragment +=
        fieldName +
        `: field(name: "` +
        field +
        `") {
                  value
              }
              `;
    }
  }
  return fieldsFragment;
};

export const GetTemplateSchemaQuery = (template: string): string => {
  return (
    `query {
          __type(name:"` +
    template +
    `") {
              fields {
                  name
                  description
              }  
          }
      }`
  );
};

export const GetSchemaQuery = (startItems?: string, templates?: string, fields?: string, cursor?: string): string => {
  let pathFragment = '';
  if (startItems) {
    const paths = startItems.split(',');
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i].trim().toLowerCase().replaceAll('{', '').replaceAll('}', '').replaceAll('-', '');
      pathFragment += AuthoringPathFragment.replace('GUID', path);
    }
  }

  let templateFragment = '';
  if (templates) {
    const templateStrings = templates.split(',');
    for (let i = 0; i < templateStrings.length; i++) {
      const template = templateStrings[i]
        .trim()
        .toLowerCase()
        .replaceAll('{', '')
        .replaceAll('}', '')
        .replaceAll('-', '');
      templateFragment += AuthoringTemplatesFragment.replace('GUID', template);
    }
  }

  const query = SchemaQueryTemplate.replace('pathsFragment', pathFragment)
    .replace('templatesFragment', templateFragment)
    .replace('langFragment', 'en')
    .replace('afterFragment', cursor ? 'after: "' + cursor + '"' : '');

  return query;
};
