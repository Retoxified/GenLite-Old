import { GenLitePlugin } from "../core/interfaces/plugin.interface";

export class GenLiteUIPanel implements GenLitePlugin {
    static pluginName = "GenLiteUIPanel";


    genliteUI: HTMLDivElement;
    genliteUITitle: HTMLDivElement;
    genliteUIBody: HTMLDivElement;
    genliteUITabContainer: HTMLDivElement;
    genliteUITabs: {[key:string]: HTMLDivElement} = {};
    genliteUIContentContainer: HTMLDivElement;
    genliteUIOpenButton: HTMLDivElement;


    async init() {
        // Create Settings Panel
        this.genliteUI = document.createElement("div");
        this.genliteUI.id = "genlite-genlite-ui";
        this.genliteUI.style.display = "block";
        this.genliteUI.style.position = "fixed";
        this.genliteUI.style.top = "0";
        this.genliteUI.style.right = "-300px";
        this.genliteUI.style.width = "300px";
        this.genliteUI.style.height = "100%";
        this.genliteUI.style.backgroundColor = "rgba(0,0,0,0.8)";
        this.genliteUI.style.zIndex = "9999";
        this.genliteUI.style.overflow = "auto";
        this.genliteUI.style.padding = "10px";
        this.genliteUI.style.boxSizing = "border-box";
        this.genliteUI.style.color = "white";
        this.genliteUI.style.fontFamily = "sans-serif";
        this.genliteUI.style.fontSize = "14px";
        this.genliteUI.style.lineHeight = "1.5";
        this.genliteUI.style.textAlign = "left";
        this.genliteUI.style.userSelect = "none";
        document.body.appendChild(this.genliteUI);

        // Create Settings Panel Header
        const genliteUIHeader = document.createElement("div");
        genliteUIHeader.id = "genlite-genlite-ui-header";
        genliteUIHeader.style.display = "flex";
        genliteUIHeader.style.justifyContent = "space-between";
        genliteUIHeader.style.alignItems = "center";
        genliteUIHeader.style.marginBottom = "10px";
        // Make sure the Settings Panel Header is always on top of the Settings Panel Body
        genliteUIHeader.style.zIndex = "9999";
        this.genliteUI.appendChild(genliteUIHeader);

        // Create Settings Panel Header Title
        const genliteUIHeaderTitle = document.createElement("div");
        genliteUIHeaderTitle.id = "genlite-genlite-ui-header-title";
        genliteUIHeaderTitle.style.fontWeight = "bold";
        genliteUIHeaderTitle.style.fontSize = "18px";
        genliteUIHeaderTitle.style.marginBottom = "5px";
        genliteUIHeaderTitle.innerText = "GenLite Settings";
        genliteUIHeaderTitle.style.fontFamily = "acme, times new roman, Times, serif";
        genliteUIHeader.appendChild(genliteUIHeaderTitle);
        this.genliteUITitle = genliteUIHeaderTitle;

        // Create Settings Panel Body
        this.genliteUIBody = document.createElement("div");
        this.genliteUIBody.id = "genlite-genlite-ui-body";
        this.genliteUI.appendChild(this.genliteUIBody);

        // Create Settings Panel Open Button
        const genliteUIOpenButton = document.createElement("div");
        genliteUIOpenButton.id = "genlite-genlite-ui-open-button";
        genliteUIOpenButton.style.position = "fixed";
        genliteUIOpenButton.style.top = "15px";
        genliteUIOpenButton.style.right = "0px";

        // Make Settings Panel Open Button a Square
        genliteUIOpenButton.style.width = "20px";
        genliteUIOpenButton.style.height = "20px";
        // Set Settings Panel Open Button Background Color
    
        genliteUIOpenButton.style.backgroundColor = "rgba(0,0,0,0.8)";
        genliteUIOpenButton.style.color = "white";
        genliteUIOpenButton.style.fontFamily = "sans-serif";
        genliteUIOpenButton.style.fontSize = "10px";
        genliteUIOpenButton.style.lineHeight = "1";
        genliteUIOpenButton.style.textAlign = "center";
        genliteUIOpenButton.style.userSelect = "none";
        genliteUIOpenButton.style.cursor = "pointer";
        // Set Settings Panel Open Button Text to a Font Awesome Icon Left Cheveron
        genliteUIOpenButton.innerHTML = "<i class='fas fa-chevron-left'></i>";

        // Center Font Awesome Icon in Settings Panel Open Button
        genliteUIOpenButton.style.display = "flex";
        genliteUIOpenButton.style.justifyContent = "center";
        genliteUIOpenButton.style.alignItems = "center";

        genliteUIOpenButton.addEventListener("click", () => {
            // Hide Settings Panel Open Button
            genliteUIOpenButton.style.display = "none";
            // Do Open Animation
            this.genliteUI.style.animation = "genlite-genlite-ui-open 0.5s ease-in-out forwards";
        });

        this.genliteUIOpenButton = genliteUIOpenButton;



        document.body.appendChild(genliteUIOpenButton);


        // Inject CSS Styles to the DOM for the Settings Panel Transition
        const style = document.createElement("style");
        style.innerHTML = `
            @keyframes genlite-genlite-ui-open {
                from {
                    right: -300px;
                }
                to {
                    right: 0px;
                }
            }
            @keyframes genlite-genlite-ui-close {
                from {
                    right: 0px;
                }
                to {
                    right: -300px;
                }
            }
        `;
        document.head.appendChild(style);

        // Tab Container which will hold all the tabs (icons stacked vertically on the right side of the settings panel)
        this.genliteUITabContainer = document.createElement("div");
        this.genliteUITabContainer.id = "genlite-tab-container";
        this.genliteUITabContainer.style.display = "flex";
        this.genliteUITabContainer.style.flexDirection = "column";
        this.genliteUITabContainer.style.justifyContent = "flex-start";
        this.genliteUITabContainer.style.alignItems = "center";
        this.genliteUITabContainer.style.position = "absolute";
        this.genliteUITabContainer.style.top = "0px";
        this.genliteUITabContainer.style.right = "0px";
        this.genliteUITabContainer.style.width = "50px";
        this.genliteUITabContainer.style.height = "100%";
        this.genliteUITabContainer.style.backgroundColor = "rgba(0,0,0,0.8)";

        // Set Tab Container to Overflow: Auto to allow for scrolling
        this.genliteUITabContainer.style.overflow = "auto";

        this.genliteUIBody.appendChild(this.genliteUITabContainer);

        // Settings Panel Content Container which will hold all the content for the currently selected tab
        this.genliteUIContentContainer = document.createElement("div");
        this.genliteUIContentContainer.id = "genlite-content-container";
        this.genliteUIContentContainer.style.position = "absolute";
        this.genliteUIContentContainer.style.top = "35px";
        this.genliteUIContentContainer.style.left = "0px";
        this.genliteUIContentContainer.style.width = "calc(100% - 50px)"; // 50px is the width of the tab container
        this.genliteUIContentContainer.style.height = "calc(100% - 35px)"; // 35px is the height of the header

        // Set Settings Panel Content Container to Overflow: Auto to allow for scrolling
        this.genliteUIContentContainer.style.overflow = "auto";
        this.genliteUIBody.appendChild(this.genliteUIContentContainer);

        // Make a button to close the settings panel (this button will be placed will be the first tab)
        const genliteUITabCloseButton = document.createElement("div");
        genliteUITabCloseButton.id = "genlite-tab-close-button";
        genliteUITabCloseButton.style.width = "32px";
        genliteUITabCloseButton.style.height = "32px";
        genliteUITabCloseButton.style.fontFamily = "sans-serif";
        genliteUITabCloseButton.style.fontSize = "14px";
        genliteUITabCloseButton.style.lineHeight = "1";
        genliteUITabCloseButton.style.textAlign = "center";
        genliteUITabCloseButton.style.userSelect = "none";
        genliteUITabCloseButton.style.cursor = "pointer";
        genliteUITabCloseButton.innerHTML = "<i class='fas fa-times'></i>";

        // Make exit button a red rounded square with white text
        genliteUITabCloseButton.style.backgroundColor = "rgba(255,0,0,0.8)";
        genliteUITabCloseButton.style.borderRadius = "5px";
        genliteUITabCloseButton.style.color = "white";

        // Align the vertical center of the exit button with the center of the panel header
        genliteUITabCloseButton.style.marginTop = "calc(50% - 16px)";



        // Center Font Awesome Icon in Settings Panel Open Button
        genliteUITabCloseButton.style.display = "flex";
        genliteUITabCloseButton.style.justifyContent = "center";
        genliteUITabCloseButton.style.alignItems = "center";
            
        genliteUITabCloseButton.addEventListener("click", () => {
            // Do Close Animation
            this.genliteUI.style.animation = "genlite-genlite-ui-close 0.5s ease-in-out forwards";
            // Show Settings Panel Open Button
            genliteUIOpenButton.style.display = "flex";
        });

        // Add the close button to the tab container
        this.genliteUITabContainer.appendChild(genliteUITabCloseButton);
    }

    // Add a Tab to the Settings Panel
    addTab(tab_icon: string, tab_name: string, tab_content: HTMLElement) {
        // Make sure the tab icon, tab name, and tab content are not null
        if (tab_icon == null || tab_name == null || tab_content == null) {
            console.error("Genlite UI: Tab Icon, Tab Name, and Tab Content cannot be null");
            return;
        }

        // If tab_name is already a key in genliteUITabs, then the tab already exists
        if (this.genliteUITabs[tab_name] != null) {
            console.error("Genlite UI: Tab with name " + tab_name + " already exists");
            return;
        }


        // Create Tab Icon
        const tabIcon = document.createElement("img");
        tabIcon.src = tab_icon;
        tabIcon.style.width = "30px";
        tabIcon.style.height = "30px";
        tabIcon.style.margin = "10px";
        tabIcon.style.cursor = "pointer";
        tabIcon.style.userSelect = "none";
        this.genliteUITabContainer.appendChild(tabIcon);

        // Create Tab Name
        const tabName = document.createElement("div");
        tabName.innerHTML = tab_name;
        tabName.style.width = "100%";
        tabName.style.textAlign = "center";
        tabName.style.fontFamily = "sans-serif";
        tabName.style.fontSize = "10px";
        tabName.style.color = "white";
        tabName.style.userSelect = "none";
        tabName.style.fontFamily = "acme, times new roman, Times, serif";
        this.genliteUITabContainer.appendChild(tabName);


        // Create Tab Content (this is the content that will be displayed when the user clicks on the tab icon, it resides inside the settings panel body)
        const tabContent = document.createElement("div");
        tabContent.id = "genlite-tab-content";
        tabContent.style.width = "100%";
        tabContent.style.height = "100%";
        tabContent.style.display = "none";
        tabContent.style.flexDirection = "column";
        tabContent.style.justifyContent = "flex-start";
        tabContent.style.alignItems = "center";
        tabContent.style.position = "absolute";
        tabContent.style.top = "0px";
        tabContent.style.left = "0px";
        tabContent.style.color = "white";
        tabContent.style.fontFamily = "sans-serif";
        tabContent.style.fontSize = "10px";
        tabContent.style.lineHeight = "1";
        tabContent.style.textAlign = "center";
        tabContent.style.userSelect = "none";
        tabContent.appendChild(tab_content);
        this.genliteUIContentContainer.appendChild(tabContent);
        
        // Add to the GenliteUI Tabs Array so we can reference it later
        // Structure of the GenliteUI Tabs Array: {[key: string]: {content: HTMLElement}}}
        this.genliteUITabs[tab_name] = tabContent;

        // Add Click Event Listener to the Tab Icon
        tabIcon.addEventListener("click", () => {
            // Hide all the other tabs
            for (const tab in this.genliteUITabs) {
                this.genliteUITabs[tab].style.display = "none";
            }

            // Show the current tab
            tabContent.style.display = "flex";

            // Set the title of the settings panel to the name of the tab
            this.genliteUITitle.innerText = tab_name;
        });
    }
}