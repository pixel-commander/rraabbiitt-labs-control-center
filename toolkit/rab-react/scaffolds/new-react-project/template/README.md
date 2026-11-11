# **PROJECT_NAME**

React/Vite project created by rab-react new-react-project. Project metadata is in rab.project.json.

Run npm install, npm run dev, or npm run build.

src/main.tsx loads the shared reset, layout, grid, main dark/light theme and Shell skin styles, followed by local atoms. src/App.tsx wraps Home and Style Guide views in the shared Shell, with URL navigation in its header and a Suspense loading fallback. Shell owns the page's main landmark.

This starter expects the shared rraabbiitt-react-components project beside it in HQ. Vite and TypeScript resolve @shared to ../rraabbiitt-react-components/src; Vite deduplicates React and React DOM. Shell, RailCanvas and their animation dependencies remain owned by that shared project rather than being copied into each app. For a different project placement, update both aliases to the actual shared project location.

Shared hooks are in src/hooks. Their HandlerKey contract comes from src/HouseKeys.types.ts.
Atom metadata is in each atom folder's rab.settings.json; the scaffold assigns fresh IDs per project.

Use the rab-react scaffolds new-react-component, new-react-subcomponent, new-react-page and new-react-navigation to extend the project. Follow RULES.txt.

The Shell provides site-chrome__header container-metal. Its header shows the project display title, Home/Style Guide navigation and a light/dark toggle. It has no brand icon, project-refresh button or 3D navigation. The project runner derives a title-case title from the name unless a title is supplied.
