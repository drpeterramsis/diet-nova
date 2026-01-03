
# Diet-Nova Professional Nutrition Suite

Diet-Nova is a comprehensive web application for nutritionists and dietitians, offering advanced tools for assessment, calculation, and meal planning.

## Version History

### v2.0.255 (Current)
*   **Advanced Day Menu (New Feature):**
    *   **Weekly Structure:** Refactored `AdvancedMealCreator` to support a full 7-day weekly plan with specific meal slots (Pre-Breakfast, Breakfast, etc.), mirroring the structure of the simple Day Planner.
    *   **Precision Planning:** Plans are built using the specific Food Composition Database (by gram weight) rather than exchanges.
    *   **Alternatives:** Added support for "Main" and "Alternative" options within meal slots.
    *   **Daily Analysis:** Real-time aggregation of daily macros and micros based on the selected "Main" options.
*   **Day Menu (Simple):**
    *   **Quick Analysis:** Added a "Check Analysis" button to the Day Menu toolbar which opens the Food Composition tool in a modal for quick reference.
*   **Meal Planner:**
    *   **Label Fix:** Updated the Meal Breakdown summary table to explicitly label "Meat Lean", "Meat Med", and "Meat High" instead of shortening them to "Meat".

### v2.0.254
*   **Meal Planner Overhaul:**
    *   **3-Column Layout:** Redesigned interface to accommodate a new summary column.
    *   **Meal Summary Table:** Added a new detailed breakdown table showing total servings, composition, calories, and % of target per meal slot (Breakfast, Lunch, etc.).
*   **Simple Meal Creator Enhancement:**
    *   **Analysis Shortcut:** Added a button to quickly open the Food Analysis tool in a modal for reference.
*   **New Tool: Advanced Day Menu:**
    *   **Analysis-Based Planning:** Created a dedicated tool for planning using the Food Composition Database (by weight) instead of exchanges.
    *   **Clinical Warnings:** Includes a configurable warning system to alert when specific nutrient thresholds (e.g., Sodium < 2000mg) are breached.

### v2.0.253
*   **Meal Planner Enhancement:**
    *   **Diet Guidelines Tab:** Converted the Diet Guidelines popup into a persistent tab within the Meal Planner interface.
    *   **State Persistence:** Selected guideline remains active when switching between Calculator, Planner, and Day Menu tabs.
    *   **UI Update:** Moved "Guidelines" button to the main navigation bar within the tool.

### v2.0.252
*   **Meal Planner Enhancement:**
    *   **Diet Guidelines Tool:** Added a new reference tool accessible from the Meal Planner toolbar.
    *   **Comprehensive Data:** Includes detailed guidelines for 10 major diet types (DASH, TLC, Mediterranean, Anti-Inflammatory, MIND, FODMAP, Gluten-Free, Lactose-Free, Low GI, Balanced).
    *   **Detailed View:** Modal displays Focus, Nutrient Targets, Characteristics, and Clinical Notes for each diet.

### v2.0.251
*   **Simple Meal Builder Enhancement:**
    *   **Smart Save Options:** When saving a modified loaded meal, users are now prompted to either **Overwrite** the existing meal or **Save as New**, preventing accidental data loss.

### v2.0.250
*   **Simple Meal Builder Enhancement:**
    *   **Library UI:** Saved meals library now displays detailed content as a bulleted list for better visibility.
    *   **Duplicate Warning:** Explicit warning message when attempting to overwrite an existing meal.
*   **Dietary Assessment Update:**
    *   **Standalone Access:** Tool is now accessible from the main Tools menu without needing to select a client first.
    *   **Structure Update:** Added 'Pre-Breakfast' meal slot.
    *   **Meal Time/Duration:** Added ability to record time or duration for each meal slot.
    *   **Data Saving:** Standalone assessments can be saved to the library for authenticated users.

### v2.0.249
*   **Simple Meal Builder Enhancements:**
    *   **Duplicate Prevention:** Implemented a check when saving meals to prevent accidental duplicates. Users are prompted to overwrite existing meals if a name conflict occurs.
    *   **Ingredient Search:** Library search now scans both meal names and ingredient lists for matches.
    *   **Kcal Filtering:** Added filters to the library to find meals greater than, less than, or equal to a specific calorie count.
    *   **UI Updates:** Added "New Meal" and "Clear Content" buttons directly in the builder interface. Moved Meal Name and Tag inputs to the main builder column for better visibility and workflow.

### v2.0.248
*   **Simple Meal Builder Overhaul:**
    *   **3-Column Layout:** Redesigned interface to display Library, Builder, and Summary simultaneously for better workflow.
    *   **Integrated Library:** Saved meals library is now a permanent column, removing the need for a modal.
    *   **Crash Fix:** Implemented robust validation when loading meals to prevent crashes from malformed data.
    *   **Smart Init:** Library automatically fetches saved meals on load.

### v2.0.247
*   **Simple Meal Builder Enhancement:**
    *   **Universal Meal Library:** Added a library column to load meals saved by the user or explore the universal library from all users.
    *   **Smart Loading:** Preview meal details (Kcal, Macros, Ingredients summary) before loading.
    *   **Delete Functionality:** Users can now delete their own saved meals directly from the library interface.

### v2.0.246
*   **Simple Meal Builder Enhancement:**
    *   Added **Edit Mode** for meal items: Users can now modify the item name text directly. Numbers in brackets `(1)` are auto-formatted to red.
    *   Added **% Kcal Column** to Serves Distribution summary table.
    *   Added **Cloud Save** functionality: Save meals with Name, Tag (Breakfast/Lunch/etc), and Notes to the database.
    *   Refactored Summary Logic to accurately calculate calorie distribution percentages.

### v2.0.245
*   **Enhanced Simple Meal Builder:** Cloud status indicator, formatted search results.
*   **Detailed Nutrient Breakdowns:** Per item analysis in food composition.
*   **Group Serve Summary:** Added aggregation logic for food groups.

### v2.0.244
*   **Plan Specific Notes:** Improved styling for weekly planning notes.
*   **Consistency:** Unified note display across tools.

## Key Features

1.  **Clinical Workspace**:
    *   **Client Manager**: Full profile management, visit tracking, history charts.
    *   **NFPE Assessment**: Nutrition-Focused Physical Exam checklist.
    *   **Dietary Assessment**: 24-Hour recall and food habits analysis.
    *   **Pediatric Tools**: STRONGkids, Growth Charts (WHO/CDC), Waist Percentiles, MAMC.

2.  **Body & Energy**:
    *   **Kcal Calculator**: Advanced energy requirement calculations (Mifflin, Harris-Benedict, EER).
    *   **BMR Calculator**: Basic metabolic rate.
    *   **BMI Calculator**: Visual gauge and classification.
    *   **Height Estimator**: Estimate height from Ulna/Knee height.

3.  **Diet Planning**:
    *   **Meal Planner**: Comprehensive weekly meal planning with macro targeting.
    *   **Simple Meal Builder**: Quick single-meal construction using exchanges.
    *   **Advanced Day Menu**: Planning using precise food composition analysis and clinical warning limits.
    *   **Food Exchange Lists**: Searchable Simple and Pro lists.

4.  **Knowledge Hub**:
    *   **Food Composition**: Analysis of specific food items (Cloud/Local DB).
    *   **Encyclopedia**: Vitamins, Minerals, Definitions.
    *   **Lab Reference**: Biochemical reference ranges and interpretations.
    *   **Instructions Library**: Printable patient instructions.

## Technical Stack
*   **Frontend**: React, TypeScript, Tailwind CSS
*   **Build Tool**: Vite
*   **Backend**: Supabase (PostgreSQL, Auth)

## Deployment
This project is configured for deployment on standard static hosting services or cloud platforms. Ensure environment variables for Supabase are correctly set.
