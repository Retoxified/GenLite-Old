import { GenLitePlugin } from "../core/interfaces/plugin.interface";

export class GenLiteUIPanel implements GenLitePlugin {
    static pluginName = "GenLiteUIPanel";


    // Important Elements
    genliteUI: HTMLDivElement;
    genliteUITitle: HTMLDivElement;
    genliteUIBody: HTMLDivElement;
    genliteUITabContainer: HTMLDivElement;
    genliteUITabs: {[key:string]: {content: HTMLDivElement, settings: HTMLDivElement}} = {};
    genliteUIContentContainer: HTMLDivElement;
    genliteUIOpenButton: HTMLDivElement;

    // Important Animations
    private PanelAnimation: Animation;
    private ButtonAnimation: Animation;



    panelOpen: boolean = false;


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

        // When a user clicks on the left edge of the Settings Panel and drags it, resize the Settings Panel
        let isDragging = false;
        let showDragCursor = false;
        this.genliteUI.addEventListener("mousedown", (e) => {
            if (e.offsetX < 10 && !isDragging) {
                isDragging = true;
            }
        });

        // On Mouse Move in the body, resize the Settings Panel
        document.body.addEventListener("mousemove", (e) => {
            // If we are within 10px of the left edge of the Settings Panel, resize the Settings Panel
            // Get Bounding Rect of the Settings Panel
            let rect = this.genliteUI.getBoundingClientRect();
            // rect structure: {x: 0, y: 0, width: 300, height: 100, top: 0, right: 300, bottom: 100, left: 0}
            if (e.clientX < rect.left + 10 && showDragCursor) {
                console.log("Mouse is within 10px of the left edge of the Settings Panel")
                document.body.style.cursor = "col-resize";
            } else {
                console.log(rect.left + 10 && showDragCursor)
                document.body.style.cursor = "default";
            }

            if (isDragging) {
                // Max width of the Settings Panel is 25% of the window width
                if (window.innerWidth - e.clientX > window.innerWidth * 0.25) {
                    this.genliteUI.style.width = `${window.innerWidth * 0.25}px`;
                } else if (window.innerWidth - e.clientX < 300) {
                    // Min width of the Settings Panel is 300px
                    this.genliteUI.style.width = "300px";
                } else {
                    // Resize is based on the mouse position relative to the window
                    this.genliteUI.style.width = `${window.innerWidth - e.clientX}px`;
                }

                this.PanelAnimation = this.genliteUI.animate([
                    { right: `-${this.genliteUI.offsetWidth}px` },
                    { right: `0px` }
                ], {
                    duration: 500,
                    easing: "ease-in-out",
                    fill: "forwards"
                });
                this.genliteUI.style.right = `-${this.genliteUI.offsetWidth}px`
                this.PanelAnimation.finish();


                this.ButtonAnimation = this.genliteUIOpenButton.animate([
                    { transform: "rotate(0deg)", right: "0px" },
                    { transform: "rotate(180deg)", right: `${this.genliteUI.offsetWidth}px` }
                ], {
                    duration: 500,
                    easing: "ease-in-out",
                    fill: "forwards"
                });
                this.PanelAnimation.finish();
            }
        });



        // On Mouse Up in the body, stop resizing the Settings Panel
        document.body.addEventListener("mouseup", (e) => {
            if (isDragging) {
                isDragging = false;
            }
        });

        // On Mouse Up in the Settings Panel, stop resizing the Settings Panel
        this.genliteUI.addEventListener("mouseup", (e) => {
            if (isDragging) {
                isDragging = false;
            }
        });

        // On Mouse Enter, allow tracking of mouse position
        this.genliteUI.addEventListener("mouseenter", (e) => {
            showDragCursor = true;
        });

        this.genliteUI.addEventListener("mouseleave", (e) => {
            showDragCursor = false;
        });


        // When the genliteUI is resized, move the genliteUIOpenButton to the left edge of the genliteUI
        this.genliteUI.addEventListener("resize", (e) => {
            this.genliteUIOpenButton.style.right = `${this.genliteUI.offsetWidth}px`;
        });

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
        this.genliteUIOpenButton = document.createElement("div");
        this.genliteUIOpenButton.id = "genlite-genlite-ui-open-button";
        this.genliteUIOpenButton.style.position = "fixed";
        this.genliteUIOpenButton.style.top = "15px";
        this.genliteUIOpenButton.style.right = "0px";

        // Make Settings Panel Open Button a Square
        this.genliteUIOpenButton.style.width = "20px";
        this.genliteUIOpenButton.style.height = "20px";
        // Set Settings Panel Open Button Background Color
    
        this.genliteUIOpenButton.style.backgroundColor = "rgba(0,0,0,0.8)";
        this.genliteUIOpenButton.style.color = "white";
        this.genliteUIOpenButton.style.fontFamily = "acme, times new roman, Times, serif";
        this.genliteUIOpenButton.style.fontSize = "12px";
        this.genliteUIOpenButton.style.lineHeight = "1";
        this.genliteUIOpenButton.style.textAlign = "center";
        this.genliteUIOpenButton.style.userSelect = "none";
        this.genliteUIOpenButton.style.cursor = "pointer";
        // Set Settings Panel Open Button Text to a Font Awesome Icon Left Cheveron
        this.genliteUIOpenButton.innerHTML = "<i class='fas fa-chevron-left'></i>";

        // Center Font Awesome Icon in Settings Panel Open Button
        this.genliteUIOpenButton.style.display = "flex";
        this.genliteUIOpenButton.style.justifyContent = "center";
        this.genliteUIOpenButton.style.alignItems = "center";


        this.ButtonAnimation = this.genliteUIOpenButton.animate([
            { transform: "rotate(0deg)", right: "0px" },
            { transform: "rotate(180deg)", right: "300px" }
        ], {
            duration: 500,
            easing: "ease-in-out",
            fill: "forwards"
        });
        this.ButtonAnimation.pause();

        this.PanelAnimation = this.genliteUI.animate([
            { right: "-300px" },
            { right: "0px" }
        ], {
            duration: 500,
            easing: "ease-in-out",
            fill: "forwards"
        });
        this.PanelAnimation.pause();
            
        this.genliteUIOpenButton.addEventListener("click", () => {
            // If this.panelOpen is false, open the Settings Panel
            if (!this.panelOpen) {
                this.panelOpen = true;
                this.ButtonAnimation.playbackRate = 1;
                this.PanelAnimation.playbackRate = 1;
                this.ButtonAnimation.currentTime = 0;
                this.PanelAnimation.currentTime = 0;
                this.ButtonAnimation.play();
                this.PanelAnimation.play();
            }
            // If this.panelOpen is true, close the Settings Panel
            else {
                this.panelOpen = false;
                this.ButtonAnimation.reverse();
                this.PanelAnimation.reverse();
            }
        });

        document.body.appendChild(this.genliteUIOpenButton);


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
        tabName.style.fontFamily = "acme, times new roman, Times, serif";
        tabName.style.fontSize = "12px";
        tabName.style.color = "white";
        tabName.style.userSelect = "none";
        this.genliteUITabContainer.appendChild(tabName);
 
        // Make Tab Content Container (Holds Settings Above and Tab Content Below)
        const tabContentContainer = document.createElement("div");
        tabContentContainer.id = "genlite-tab-content-container";
        tabContentContainer.style.display = "none";
        tabContentContainer.style.flexDirection = "column";
        tabContentContainer.style.justifyContent = "flex-start";
        tabContentContainer.style.alignItems = "center";
        tabContentContainer.style.color = "white";
        tabContentContainer.style.fontFamily = "acme, times new roman, Times, serif";
        tabContentContainer.style.fontSize = "12px";
        tabContentContainer.style.lineHeight = "1";
        tabContentContainer.style.overflowX = "hidden";
        tabContentContainer.style.overflowY = "auto";
        this.genliteUIContentContainer.appendChild(tabContentContainer);

        // Make a container for the tab settings content (this is the content that will be displayed when the user clicks on the tab icon, it resides inside the settings panel body, and is shown before the tab content)
        const tabSettingsContentContainer = document.createElement("div");
        tabSettingsContentContainer.id = "genlite-tab-settings-content-container";
        tabSettingsContentContainer.style.display = "flex";
        tabSettingsContentContainer.style.flexDirection = "column";
        tabSettingsContentContainer.style.justifyContent = "flex-start";
        tabSettingsContentContainer.style.alignItems = "center";
        tabSettingsContentContainer.style.color = "white";
        tabSettingsContentContainer.style.fontFamily = "acme, times new roman, Times, serif";
        tabSettingsContentContainer.style.fontSize = "12px";
        tabSettingsContentContainer.style.lineHeight = "1";
        tabSettingsContentContainer.style.textAlign = "center";
        tabSettingsContentContainer.style.width = "100%";
        tabSettingsContentContainer.style.height = "100%";
        tabSettingsContentContainer.style.marginTop = "10px";

        // Add the tab settings content container to the tab content container
        tabContentContainer.appendChild(tabSettingsContentContainer);

        // Add a seperator between the tab settings content and the tab content
        const seperator = document.createElement("div");
        seperator.style.width = "100%";
        seperator.style.height = "1px";
        seperator.style.backgroundColor = "rgba(255,255,255,0.2)";
        tabContentContainer.appendChild(seperator);


        // Create Tab Content (this is the content that will be displayed when the user clicks on the tab icon, it resides inside the settings panel body, and is shown after the tab settings content container)
        const tabContent = document.createElement("div");
        tabContent.id = "genlite-tab-content";
        tabContent.style.display = "flex";
        tabContent.style.flexDirection = "column";
        tabContent.style.justifyContent = "flex-start";
        tabContent.innerHTML = tab_content.innerHTML;
        // Add the tab content to the tab content container
        tabContentContainer.appendChild(tabContent);




        // Add to the GenliteUI Tabs Array so we can reference it later
        // Structure of the GenliteUI Tabs Array: {[key: string]: {content: HTMLElement}}}
        this.genliteUITabs[tab_name] = {content: tabContentContainer, settings: tabSettingsContentContainer};

        // Add Click Event Listener to the Tab Icon
        tabIcon.addEventListener("click", () => {
            // Hide all the other tabs
            for (const tab in this.genliteUITabs) {
                this.genliteUITabs[tab].content.style.display = "none";
            }

            // Show the current tab
            tabContentContainer.style.display = "flex";

            // Set the title of the settings panel to the name of the tab
            this.genliteUITitle.innerText = tab_name;
        });
    }

    // Add a Setting to a Tab
    addSetting(tab_name: string, setting_name: string, setting_type: string, setting_options: any, setting_default: any) {
        // If the tab does not exist, then return
        if (this.genliteUITabs[tab_name] == null) {
            console.error("Genlite UI: Tab with name " + tab_name + " does not exist");
            return;
        }

        // Get the tab settings content container
        const tabSettingsContentContainer = this.genliteUITabs[tab_name].settings;

        // If no settings are currently in the tab settings content container, then add a title
        if (tabSettingsContentContainer.children.length == 0) {
            // Add a seperator between title and settings
            const seperator = document.createElement("div");
            seperator.style.width = "100%";
            seperator.style.height = "1px";
            seperator.style.backgroundColor = "rgba(255,255,255,0.2)";
            tabSettingsContentContainer.appendChild(seperator);

            // Create Title
            const title = document.createElement("div");
            title.innerHTML = "Settings";
            title.style.width = "100%";
            title.style.textAlign = "center";
            title.style.fontFamily = "acme, times new roman, Times, serif";
            title.style.fontSize = "14px";
            title.style.color = "white";
            title.style.margin = "10px 0px";
            title.style.padding = "0px";
            title.style.lineHeight = "1";
            tabSettingsContentContainer.appendChild(title);
        }

        // Create Setting Container
        const settingContainer = document.createElement("div");
        settingContainer.style.width = "100%";
        settingContainer.style.height = "auto";
        settingContainer.style.display = "flex";
        settingContainer.style.flexDirection = "row";
        settingContainer.style.justifyContent = "flex-start";
        settingContainer.style.alignItems = "center";
        settingContainer.style.position = "relative";
        settingContainer.style.top = "0px";
        settingContainer.style.left = "0px";
        settingContainer.style.margin = "5px";
        settingContainer.style.padding = "0px";
        settingContainer.style.paddingLeft = "15px";
        settingContainer.style.paddingBottom = "10px";
        settingContainer.style.color = "white";
        settingContainer.style.fontFamily = "acme, times new roman, Times, serif";
        settingContainer.style.fontSize = "12px";
        settingContainer.style.lineHeight = "1";
        settingContainer.style.textAlign = "center";
        tabSettingsContentContainer.appendChild(settingContainer);

        // Create Setting Name
        const settingName = document.createElement("div");
        settingName.innerHTML = setting_name;
        settingName.style.width = "auto";   
        settingName.style.height = "auto";
        settingName.style.display = "flex";
        settingName.style.flexDirection = "row";
        settingName.style.justifyContent = "flex-start";
        settingName.style.alignItems = "center";
        settingName.style.position = "relative";
        settingName.style.top = "0px";
        settingName.style.left = "0px";
        settingName.style.margin = "0px 10px 0px 0px";
        settingName.style.padding = "0px";
        settingName.style.color = "white";
        settingName.style.fontFamily = "acme, times new roman, Times, serif";
        settingName.style.fontSize = "12px";
        settingName.style.lineHeight = "1";
        settingName.style.textAlign = "center";
        settingContainer.appendChild(settingName);

        // WARNING: THIS SWITCH STATEMENT CALLS THE RETURN STATEMENT FOR THE FUNCTION, SO ANYTHING AFTER THIS SWITCH STATEMENT WILL NOT BE EXECUTED
        // Create Setting Input
        switch(setting_type) {
            case "checkbox":
                // Create Checkbox
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.checked = setting_default;
                checkbox.style.width = "auto";
                checkbox.style.height = "auto";
                checkbox.style.display = "flex";
                checkbox.style.flexDirection = "row";
                checkbox.style.justifyContent = "flex-start";
                checkbox.style.alignItems = "center";
                checkbox.style.position = "relative";
                checkbox.style.top = "0px";
                checkbox.style.left = "0px";
                checkbox.style.margin = "0px 0px 0px 10px";
                checkbox.style.padding = "0px";
                checkbox.style.color = "white";
                checkbox.style.fontFamily = "acme, times new roman, Times, serif";
                checkbox.style.fontSize = "12px";
                checkbox.style.lineHeight = "1";
                checkbox.style.textAlign = "center";
                settingContainer.appendChild(checkbox);
                return checkbox;
            case "dropdown":
                // Create Dropdown
                const dropdown = document.createElement("select");
                dropdown.style.width = "auto";
                dropdown.style.height = "auto";
                dropdown.style.display = "flex";
                dropdown.style.flexDirection = "row";
                dropdown.style.justifyContent = "flex-start";
                dropdown.style.alignItems = "center";
                dropdown.style.position = "relative";
                dropdown.style.top = "0px";
                dropdown.style.left = "0px";
                dropdown.style.margin = "0px 0px 0px 10px";
                dropdown.style.padding = "0px";
                dropdown.style.color = "white";
                dropdown.style.fontFamily = "acme, times new roman, Times, serif";
                dropdown.style.fontSize = "12px";
                dropdown.style.lineHeight = "1";
                dropdown.style.textAlign = "center";
                settingContainer.appendChild(dropdown);

                // Add Options to the Dropdown
                for (const option in setting_options) {
                    const dropdownOption = document.createElement("option");
                    dropdownOption.value = option;
                    dropdownOption.innerHTML = option;
                    dropdown.appendChild(dropdownOption);
                }

                // Set the default value
                dropdown.value = setting_default;
                return dropdown;
            case "slider":
                // Create Slider
                const slider = document.createElement("input");
                slider.type = "range";
                slider.min = setting_options.min;
                slider.max = setting_options.max;
                slider.step = setting_options.step;
                slider.value = setting_default;
                slider.style.width = "auto";
                slider.style.height = "auto";
                slider.style.display = "flex";
                slider.style.flexDirection = "row";
                slider.style.justifyContent = "flex-start";
                slider.style.alignItems = "center";
                slider.style.position = "relative";
                slider.style.top = "0px";
                slider.style.left = "0px";
                slider.style.margin = "0px 0px 0px 10px";
                slider.style.padding = "0px";
                slider.style.color = "white";
                slider.style.fontFamily = "acme, times new roman, Times, serif";
                slider.style.fontSize = "12px";
                slider.style.lineHeight = "1";
                slider.style.textAlign = "center";
                settingContainer.appendChild(slider);
                return slider;
            case "textbox":
                // Create Textbox
                const textbox = document.createElement("input");
                textbox.type = "text";
                textbox.value = setting_default;
                textbox.style.width = "auto";
                textbox.style.height = "auto";
                textbox.style.display = "flex";
                textbox.style.flexDirection = "row";
                textbox.style.justifyContent = "flex-start";
                textbox.style.alignItems = "center";
                textbox.style.position = "relative";
                textbox.style.top = "0px";
                textbox.style.left = "0px";
                textbox.style.margin = "0px 0px 0px 10px";
                textbox.style.padding = "0px";
                textbox.style.color = "white";
                textbox.style.fontFamily = "acme, times new roman, Times, serif";
                textbox.style.fontSize = "12px";
                textbox.style.lineHeight = "1";
                textbox.style.textAlign = "center";
                settingContainer.appendChild(textbox);
                return textbox;
            default:
                console.error("Invalid setting type: " + setting_type);
                return null;
        }
    }
}