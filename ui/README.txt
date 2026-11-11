LOCAL SHARED UI COPIES

Shared UI component copies now live in src/components/. This folder retains
the drag-scroll utility and the type contract used by those copies.
Original shared-project source files remain in the shared project.

src/components/Slider          Controlled range slider.
src/components/SmartTooltip    Pointer-following tooltip.
src/components/CodeEditAndView Code editor, viewer, validation and save hooks.
src/components/MessageBox      Dashboard composer.
js/drag-scroll             Pointer drag scrolling.
HouseKeys.types.ts         Shared type contract required by these copies.

Copies include their local styles, types, hooks, demos, metadata, and notices.
CodeEditAndView includes its bundled editor and LICENSES.txt. It does not
need an editor CDN. TypeScript syntax validation uses the npm typescript
dependency that is already in the dashboard package.

Dashboard components and shared component copies live under src/components/.
No HQ sibling path is required.
Do not update the original shared project when changing a local copy.

CodeEditAndView delegates persistence to handleSave. Its Style Guide demo
saves in memory. Disk saving needs the server API in api/file-system/.

Inherited contract issue: CodeEditAndView currently calls its change,
validation and save callbacks without the complete third props argument.
This is unchanged from the copied source. Fix that contract before relying
on the third argument in an application integration.
