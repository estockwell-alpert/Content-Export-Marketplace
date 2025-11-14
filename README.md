## Content Export Tool for XM Cloud

The purpose of this module is to enable Sitecore authors (with limited technical ability) to flexibly and easily export content in bulk from Sitecore, using a user friendly UI that enables them to export any configuration of item and fields (no need to write Powershell scripts).

The [Content Export Tool](https://github.com/estockwell-alpert/ContentExportTool), created in 2018, is a .NET Sitecore module that provided these features, but the module is not compatible with XM Cloud since XM Cloud does not allow customizations to the CM file system. This project recreates the Content Export Tool as a standalone Node application that runs in the browser and communicates with the user's XM Cloud or XP instance through the GraphQL API, and introduces new AI features using Copilot.

## Using the Application

### Content Export:

**1. Enter your filters to choose what items and data to export**

**Start Item:** 

The export will pull all items under and including this item. You can enter multiple start items to export different parts of the content tree at the same time. If Start Item is empty, the whole content tree will be included

Paste in the Guid IDs of your start item(s), or click Browse to select from the content tree

<img width="1401" height="215" alt="image" src="https://github.com/user-attachments/assets/443a8d46-748d-42d4-bf7d-ab7983f96b43" />

Use the Browse button to browse the content tree. You can select your items from the tree and the correct IDs will be inserted into the field.

<img width="777" height="548" alt="image" src="https://github.com/user-attachments/assets/e17e1b45-1631-4942-8e5f-e95c8b7dc9fe" />

<br/><br/>

**Templates:** 

This filters the above items so that only items that match the given template IDs are exported. For example, 

<img width="1407" height="242" alt="image" src="https://github.com/user-attachments/assets/1bf74b0d-72bb-44d5-aac3-a120ec86eabc" />

Paste in the Guid IDs of your templates, or click Browse to select templates. 

<img width="793" height="562" alt="image" src="https://github.com/user-attachments/assets/6ee6f59a-9a15-4f5f-87fd-b18b7e8563f7" />

You can check the "Include items that inherit these templates" to select a base template and export every item whose template inherits it.

<br/><br/>

**Fields:** 

Enter all of the fields that you want to export

<img width="1407" height="203" alt="image" src="https://github.com/user-attachments/assets/5a70e954-e7d9-4299-a6e3-ce837b02043a" />

The export will only include fields that are entered in this box; if you want to export all fields automatically, check the All Fields checkbox.

You can use Browse to select fields only after selecting at least one template; the Browse modal pulls in the fields for the selected Templates

<img width="777" height="542" alt="image" src="https://github.com/user-attachments/assets/5dcc4ecd-19ac-4808-aa9e-7ea149d1a223" />

Select any additional checkboxes for standard fields data and languages.

<br/><br/>

**2. Run the export**

Click Run Export. When the export is complete, the page will scroll to the top where there is now a Download Report button. Right click and open in a new tab to download the file.

<img width="1135" height="163" alt="image" src="https://github.com/user-attachments/assets/1296fe40-4cd8-4fd4-9b39-69de8a5eaa8e" />

<br/><br/>

### Content Import:

**To modify content**, I recommend exporting the content and fields and you want to modify first, editing the CSV file, and then uploading it. This ensures that your CSV file is already formatted correctly. **ALWAYS MAKE A BACKUP PACKAGE OF YOUR CONTENT BEFORE MODIFYING IT WITH THE CONTENT IMPORT TOOL**

<img width="656" height="946" alt="image" src="https://github.com/user-attachments/assets/e6f7247f-b8c5-42e5-b1e8-7301d09f7ed7" />

1. Select the Import tab
2. Upload a CSV file
   - Required columns:
     - Update: Item Path (must be the item path; by default, this matches the export)
     - Create: Item Path*, Template, Name
3. Select Update (default) or Create
4. Click Import
5. When the import is complete, it will show a success message or display errors for any lines that failed to process

_*For Creating items, the Item Path must be the **Guid ID** of the **Parent item** that you are creating the new item under._

<img width="1456" height="334" alt="image" src="https://github.com/user-attachments/assets/f2af87dd-2dc9-4242-9deb-421eaa633423" />

Example files:

[Update Content](https://github.com/Sitecore-Hackathon/2025-DED/blob/main/docs/exampleFiles/Import-Update.csv)

[Create Content](https://github.com/Sitecore-Hackathon/2025-DED/blob/main/docs/exampleFiles/Import-Create.csv)

## Terms and Conditions ##

The Sitecore Content Export/Import Tool is a free-to-use tool provided as a courtesy. Users are responsible for understanding the tool and making their own export configurations and import files. Bug reports can be opened on this repo, but we are not responsible for helping users formulate their exports or imports. Documentation is available on our [blog](https://ericastockwellalpert.wordpress.com/2025/08/07/how-to-get-the-most-out-of-the-content-export-import-tool/) for learning how to use the tool.

Since every environment is different, update processes should not be run in a production environment without your team or organization thoroughly testing first. We recommend testing all import processes in a development/staging environment **and always making a backup package of your content before modifying it with the tool**. All users are responsible for their own content; we are not responsible for any content changes made in error.

## Privacy Policy ##

The Content Export/Import Tool does not save or use any personal data. All user data is retrieved from the Marketplace SDK and is not stored by the Content Export/Import Tool; any persistent settings are saved in localstorage.

## Support ##

To report bugs, [open a new issue on this repo](https://github.com/estockwell-alpert/Content-Export-Marketplace/issues/new)



This project was started for **Sitecore Hackathon 2025** by team DED (Dan Solovay, Erica Stockwell-Alpert, Dylan Young) at Velir, and completed for Sitecore Marketplace

