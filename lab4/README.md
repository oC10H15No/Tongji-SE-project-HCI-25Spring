# Jishi Building 4th Floor Navigation System

This project is an interactive web-based navigation system for the 4th floor of the Jishi Building. It allows users to view a floor plan, select rooms, see room details (including purpose, personnel, and images), and search for rooms or personnel.

## Project Structure

```
.
├── index.html          # Main HTML file for the application
├── css/
│   └── style.css       # CSS styles for the application
├── js/
│   ├── app.js          # Core JavaScript logic for interactivity, map handling, search, etc.
│   └── data.js         # Contains the data for rooms, personnel, and their properties
├── images/             # Directory for room images and the main floorplan image
│   ├── floorplan.png   # The main floor plan image
│   ├── 401.JPG
│   ├── ... (other room specific images)
└── report.pdf          # Design and Implementation Report
```

## How to Run

You can run or access this `lab4` navigation system in the following three ways:

**1. Via Website (GitHub Pages):**
   *   You can access the live demo directly at:
        *   **`lab4` Navigation System (Recommended):** [https://oc10h15no.github.io/Tongji-SE-project-HCI-25Spring/](https://oc10h15no.github.io/Tongji-SE-project-HCI-25Spring/)

**2. Locally by Opening `index.html` Directly:**
   *   This method assumes you have all the `lab4` project files.
   *   Ensure the `lab4` directory contains `index.html` and the subdirectories `css/`, `js/`, and `images/` with their respective files, matching the "Project Structure" section.
   *   Open the `index.html` file located within the `lab4` folder using a modern web browser (e.g., Chrome, Firefox, Safari, Edge).

**3. By Cloning the Repository and Running from the Specific Folder:**
   *   **Step 1: Clone the entire project repository**
        *   If you have Git installed, use the following command to clone the main repository which includes all labs:
          ```bash
          git clone https://github.com/oc10h15no/Tongji-SE-project-HCI-25Spring.git
          ```
   *   **Step 2: Navigate to the `lab4` folder**
        *   After cloning, change your directory into the `Tongji-SE-project-HCI-25Spring` folder, and then into its `lab4` subfolder.
          ```bash
          cd Tongji-SE-project-HCI-25Spring/lab4
          ```
   *   **Step 3: Open `index.html`**
        *   From within the `lab4` folder, open the `index.html` file using a modern web browser.

> This application is a client-side project (HTML, CSS, JavaScript) and does not require any special build steps or a local server for local execution.*


## Key Files

*   **[`index.html`](index.html):** The main entry point of the application. It sets up the basic structure of the page, including the header, sidebar, map container, and information panel.
*   **[`css/style.css`](css/style.css):** Contains all the styling rules for the application, making it responsive and visually appealing.
*   **[`js/app.js`](js/app.js):** This is the heart of the application's interactivity. It handles:
    *   Dynamic generation of the navigation menu.
    *   Placement and interaction of room markers on the floor plan.
    *   Displaying room information when a room is selected.
    *   Search functionality.
    *   Map zoom and pan controls.
    *   Sidebar toggle functionality.
    *   Image modal display.
*   **[`js/data.js`](js/data.js):** Stores all the data related to the rooms on the 4th floor. This includes room ID, name, type, position on the map, marker details, purpose, personnel, description, and associated images.
*   **[`images/floorplan.png`](images/floorplan.png):** The base image used for the interactive floor map.
*   **[`report.pdf`](report.pdf):** The Design and Implementation Report.

## Features

*   Interactive floor plan with clickable room markers.
*   Collapsible sidebar menu for room navigation, categorized by room type.
*   Detailed information panel displaying room name, purpose, description, personnel, and images.
*   Search functionality to find rooms or personnel by keywords.
*   Zoom and pan controls for the floor plan.
*   Image viewer modal for room images.
*   Responsive design for different screen sizes.

## Report

The project includes a detailed report ([`report.pdf`](report.pdf)), which covers:
*   Project background and objectives.
*   System design and interface overview.
*   Implementation details of fluid navigation.
*   Technical architecture.
*   Conclusion.
The `display/` folder contains images used within this report.