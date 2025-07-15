## Content Export Tool for XM Cloud

The purpose of this module is to enable Sitecore authors (with limited technical ability) to flexibly and easily export content in bulk from Sitecore, using a user friendly UI that enables them to export any configuration of item and fields (no need to write Powershell scripts).

The [Content Export Tool](https://github.com/estockwell-alpert/ContentExportTool), created in 2018, is a .NET Sitecore module that provided these features, but the module is not compatible with XM Cloud since XM Cloud does not allow customizations to the CM file system. This project recreates the Content Export Tool as a standalone Node application that runs in the browser and communicates with the user's XM Cloud or XP instance through the GraphQL API, and introduces new AI features using Copilot.

## Using the Application

### Content Export:

1. Enter your filters
   - Start Item(s): One of more item IDs specifying where to pull content from, separated by comma. Defaults to the full content tree. Use the Browse button to select items from the content tree.
   - Templates: One or more template ID to specify what types of items to export. Use the Browse button to see available templates.
   - Fields: All of the fields that you want included in the export. Null/invalid fields will return "n/a" in the export, so you can include fields that do not exist on all items. Use the Browse button to see available fields once you've selectd at least one template.
2. Click Run Export and wait for your CSV to download!

### Content Import:

Example files:

[Update Content](https://github.com/Sitecore-Hackathon/2025-DED/blob/main/docs/exampleFiles/Import-Update.csv)

[Create Content](https://github.com/Sitecore-Hackathon/2025-DED/blob/main/docs/exampleFiles/Import-Create.csv)

1. Select the Import tab
2. Upload a CSV file
   - Required columns:
     - Update: Item Path
     - Create: Item Path, Template, Name
3. Select Update (default) or Create
4. Click Import


This project was started for **Sitecore Hackathon 2025** by team DED (Dan Solovay, Erica Stockwell-Alpert, Dylan Young) at Velir, and completed for Sitecore Marketplace

