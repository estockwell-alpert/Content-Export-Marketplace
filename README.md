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

### Terms and Conditions ###

The Sitecore Content Export/Import Tool is a free-to-use tool provided as a courtesy. Users are responsible for understanding the tool and making their own export configurations and import files. Bug reports can be opened on this repo, but we are not responsible for helping users formulate their exports or imports. Documentation is available on our [blog](https://ericastockwellalpert.wordpress.com/2025/08/07/how-to-get-the-most-out-of-the-content-export-import-tool/) for learning how to use the tool.

Since every environment is different, update processes should not be run in a production environment without your team or organization thoroughly testing first. We recommend testing all import processes in a development/staging environment. All users are responsible for their own content, and we are not responsible for any content changes made in error.

### Privacy Policy ###

The Content Export/Import Tool does not save or use any personal data. All user data is retrieved from the Marketplace SDK and is not stored by the Content Export/Import Tool; any persistent settings are saved in localstorage.

### Support ###

To report bugs, [open a new issue on this repo](https://github.com/estockwell-alpert/Content-Export-Marketplace/issues/new)



This project was started for **Sitecore Hackathon 2025** by team DED (Dan Solovay, Erica Stockwell-Alpert, Dylan Young) at Velir, and completed for Sitecore Marketplace

