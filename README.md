## Content Export Tool for XM Cloud

The purpose of this module is to enable Sitecore authors (with limited technical ability) to flexibly and easily export content in bulk from Sitecore, using a user friendly UI that enables them to export any configuration of item and fields (no need to write Powershell scripts).

The [Content Export Tool](https://github.com/estockwell-alpert/ContentExportTool), created in 2018, is a .NET Sitecore module that provided these features, but the module is not compatible with XM Cloud since XM Cloud does not allow customizations to the CM file system. This project recreates the Content Export Tool as a standalone Node application that runs in the browser and communicates with the user's XM Cloud or XP instance through the GraphQL API, and introduces new AI features using Copilot.

## Using the Application

### Content Export:

1. Follow the In App Configuration section to to configure your instance settings
   ![Instance Configuration](https://github.com/Sitecore-Hackathon/2025-DED/blob/main/docs/images/InstanceConfiguration.png)
2. Navigate to the Content Export Tool (/Content/Export)
3. Select your Instance from the dropdown
4. Enter your filters
   - Start Item(s): One of more item IDs specifying where to pull content from, separated by comma. Defaults to the full content tree
   - Templates: One or more template ID to specify what types of items to export
   - Fields: All of the fields that you want included in the export. Null/invalid fields will return "n/a" in the export, so you can include fields that do not exist on all items
     ![Export Page](https://github.com/Sitecore-Hackathon/2025-DED/blob/main/docs/images/Export.png)
5. Click Run Export and wait for your CSV to download!

### Content Import:

Example files:

[Update Content](https://github.com/Sitecore-Hackathon/2025-DED/blob/main/docs/exampleFiles/Import-Update.csv)

[Create Content](https://github.com/Sitecore-Hackathon/2025-DED/blob/main/docs/exampleFiles/Import-Create.csv)

1. Following the In App Configuration section, configure an **authoring API endpoing endpoint**, e.g. https://mysite.sc/sitecore/api/authoring/graphql/v1/

   ![Instance Configuration](https://github.com/Sitecore-Hackathon/2025-DED/blob/main/docs/images/AuthoringSetup.png)

2. Navigate to the Content Export Tool (/Content/Export)
3. Select your Instance from the dropdown
4. Select the Import tab
5. Upload a CSV file
   - Required columns:
     - Update: Item Path
     - Create: Item Path, Template, Name
6. Select Update (default) or Create
7. Click Import
8. The post requests to the authoring API do not currently work due to a CORS error, but you can see the generated GraphQL queries in the Console
   ![Import Page](https://github.com/Sitecore-Hackathon/2025-DED/blob/main/docs/images/Import.png)


This project was started for **Sitecore Hackathon 2025** by team DED (Dan Solovay, Erica Stockwell-Alpert, Dylan Young) at Velir, and completed for Sitecore Marketplace

![Hackathon Logo](docs/images/hackathon.png?raw=true 'Hackathon Logo')
