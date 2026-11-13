import { Demo as ContactsDemo } from "../../components/BookKeeping/components/Contacts/demo/Demo";
import { Demo as FactoryDemo } from "../../dashboards/Factory/components/ComponentFactory/demo/Demo";
import { Demo as ExpensesDemo } from "../../components/BookKeeping/components/Expenses/demo/Demo";
import { Demo as BookKeepingDemo } from "../../components/BookKeeping/demo/Demo";
import { Demo as CalendarDemo } from "../../components/Calendar/demo/Demo";
import { Demo as CanvasFlowDemo } from "../../components/CanvasFlow/demo/Demo";
import { Demo as ChatDemo } from "../../components/Chat/demo/Demo";
import { Demo as CodeEditAndViewDemo } from "../../components/CodeEditAndView/demo/Demo";
import { Demo as CodeViewPopupLinkDemo } from "../../components/CodeViewPopupLink/demo/Demo";
import { Demo as DatePickerDemo } from "../../components/DatePicker/demo/Demo";
import { Demo as DropdownButtonDemo } from "../../components/DropdownButton/demo/Demo";
import { Demo as DumBotDemo } from "../../components/DumBot/demo/Demo";
import { Demo as FloatWindowDemo } from "../../components/FloatWindow/demo/Demo";
import { Demo as FolderTreeDemo } from "../../components/FolderTree/demo/Demo";
import { Demo as FullScreenWrapperDemo } from "../../components/FullScreenWrapper/demo/Demo";
import { Demo as GridAreaSelectDemo } from "../../components/GridAreaSelect/demo/Demo";
import { Demo as GridCellDemo } from "../../components/GridCell/demo/Demo";
import { Demo as GridDesignerDemo } from "../../components/GridDesigner/demo/Demo";
import { Demo as GridLayoutDisplayDemo } from "../../components/GridLayoutDisplay/demo/Demo";
import { Demo as HelpIconDemo } from "../../components/HelpIcon/demo/Demo";
import { Demo as LoginBoxDemo } from "../../components/LoginBox/demo/Demo";
import { Demo as McpViewerDemo } from "../../components/McpViewer/demo/Demo";
import { Demo as MessageBoxDemo } from "../../components/MessageBox/demo/Demo";
import { Demo as ModalDemo } from "../../components/Modal/demo/Demo";
import { Demo as NetworkGraphDemo } from "../../components/NetworkGraph/demo/Demo";
import { Demo as PassPropsDemo } from "../../components/PassProps/demo/Demo";
import { Demo as PopupDemo } from "../../components/Popup/demo/Demo";
import { Demo as ProgressBarDemo } from "../../components/ProgressBar/demo/Demo";
import { Demo as RabbitHeadDemo } from "../../components/RabbitHead/demo/Demo";
import { Demo as SearchableSelectDemo } from "../../components/SearchableSelect/demo/Demo";
import { Demo as SearchBarDemo } from "../../components/SearchBar/demo/Demo";
import { Demo as SearchResponsesDemo } from "../../components/SearchResponses/demo/Demo";
import { Demo as SiteNavDemo } from "../../components/SiteNav/demo/Demo";
import { Demo as SliderDemo } from "../../components/Slider/demo/Demo";
import { Demo as SmartTooltipDemo } from "../../components/SmartTooltip/demo/Demo";
import { Demo as StarRankingDemo } from "../../components/StarRanking/demo/Demo";
import { Demo as StatCellsDemo } from "../../components/StatCells/demo/Demo";
import { Demo as StatusBarDemo } from "../../components/StatusBar/demo/Demo";
import { Demo as TabNavDemo } from "../../components/TabNav/demo/Demo";
import { Demo as StylersDemo } from "../../components/Stylers/demo/Demo";
import { Demo as TestComponentDemo } from "../../components/TestComponent/demo/Demo";
import { Demo as ToggleGroupDemo } from "../../components/ToggleGroup/demo/Demo";
import { Demo as ToggleSectionDemo } from "../../components/ToggleSection/demo/Demo";
import { Demo as TooltipDemo } from "../../components/Tooltip/demo/Demo";
import { Demo as UiElementsDemo } from "../../components/UiElements/demo/Demo";
import { Demo as WordGraphsDemo } from "../../components/WordGraphs/demo/Demo";
import { Demo as WorldComponentsDemo } from "../../components/WorldComponents/demo/Demo";
import "./css/style-guide.css";
const containers = [
  "container-main",
  "container-outline",
  "container-dropdown",
  "container-alt",
  "container-neg",
  "container-fill",
  "container-side-rail",
];
const actions = [
  "action-outline",
  "action-filled",
  "action-ghost",
  "action-light",
];
export const StyleGuidePage = () => {
  return (
    <div className="style-guide" data-cols="1" data-gap="section">
      <header>
        <p className="style-guide-kicker">RRAABBIITT / DESIGN SYSTEM</p>
        <h1>Style guide</h1>
        <p>Charcoal surfaces. Cyan signals. One set of theme tokens.</p>
        <a className="action-text-link" href="/world-search">
          Open World Search ↗
        </a>
      </header>
      <section data-cols="1" data-gap="content">
        <h2>Color slots</h2>
        <div data-cols="1" data-gap="content">
          {[
            "main",
            "main-alt",
            "primary",
            "primary-alt",
            "secondary",
            "secondary-alt",
            "tertiary",
            "tertiary-alt",
            "muted",
            "inverse",
          ].map((slot) => (
            <div key={slot} data-cols="2" data-gap="content">
              {["color-" + slot, "color-" + slot + "-neg"].map((token) => (
                <div key={token}>
                  <div
                    className="style-guide-swatch"
                    style={{ background: "var(--" + token + ")" }}
                  />
                  <code>--{token}</code>
                </div>
              ))}
            </div>
          ))}
        </div>
        <h2>Status colors</h2>
        <div data-cols="4" data-collapse="2" data-gap="content">
          {[
            "status-success",
            "status-warning",
            "status-error",
            "status-muted",
          ].map((token) => (
            <div key={token}>
              <div
                className="style-guide-swatch"
                style={{ background: "var(--" + token + ")" }}
              />
              <code>--{token}</code>
            </div>
          ))}
        </div>
      </section>
      <section data-cols="1" data-gap="content">
        <h2>Containers</h2>
        <div data-cols="2" data-collapse="2" data-gap="content">
          {containers.map((name) => (
            <div key={name} className={name + " style-guide-sample"}>
              <h3>{name}</h3>
              <p>Reusable surface skin, composed in markup.</p>
              {name === "container-side-rail" && (
                <p>(modifiers: right, top, bottom)</p>
              )}
            </div>
          ))}
        </div>
      </section>
      <section data-cols="1" data-gap="content">
        <h2>Actions</h2>
        <div
          className="style-guide-action-list"
          data-cols="1"
          data-gap="content"
        >
          {actions.map((name) => (
            <div data-cols="4" data-collapse="2" data-gap="control" key={name}>
              <code>{name}</code>
              <button className={name} type="button">
                Default
              </button>
              <button
                className={name + " is-selected"}
                type="button"
                aria-pressed="true"
              >
                Selected
              </button>
              <button className={name} type="button" disabled>
                Disabled
              </button>
            </div>
          ))}
        </div>
      </section>
      <section data-cols="1" data-gap="content">
        <h2>Inline text color</h2>
        <p>
          Use an{" "}
          <a href="#ui-elements" className="action-text-link">
            inline link
          </a>{" "}
          or a <span className="action-text-link">colored span</span> in a
          sentence, with no underline.
        </p>
      </section>
      <section id="contacts" data-cols="1" data-gap="content">
        <h2>Contacts</h2>
        <ContactsDemo />
      </section>
      <section id="expenses" data-cols="1" data-gap="content">
        <h2>Expenses</h2>
        <ExpensesDemo />
      </section>
      <section id="book-keeping" data-cols="1" data-gap="content">
        <h2>BookKeeping</h2>
        <BookKeepingDemo />
      </section>
      <section id="calendar" data-cols="1" data-gap="content">
        <h2>Calendar</h2>
        <CalendarDemo />
      </section>
      <section id="canvas-flow" data-cols="1" data-gap="content">
        <h2>CanvasFlow</h2>
        <CanvasFlowDemo />
      </section>
      <section id="chat" data-cols="1" data-gap="content">
        <h2>Chat</h2>
        <ChatDemo />
      </section>
      <section id="code-edit-and-view" data-cols="1" data-gap="content">
        <h2>CodeEditAndView</h2>
        <CodeEditAndViewDemo />
      </section>
      <section id="code-view-popup-link" data-cols="1" data-gap="content">
        <h2>CodeViewPopupLink</h2>
        <CodeViewPopupLinkDemo />
      </section>
      <section id="date-picker" data-cols="1" data-gap="content">
        <h2>DatePicker</h2>
        <DatePickerDemo />
      </section>
      <section id="dropdown-button" data-cols="1" data-gap="content">
        <h2>DropdownButton</h2>
        <DropdownButtonDemo />
      </section>
      <section id="dum-bot" data-cols="1" data-gap="content">
        <h2>DumBot</h2>
        <DumBotDemo />
      </section>
      <section id="float-window" data-cols="1" data-gap="content">
        <h2>FloatWindow</h2>
        <FloatWindowDemo />
      </section>
      <section id="folder-tree" data-cols="1" data-gap="content">
        <h2>FolderTree</h2>
        <FolderTreeDemo />
      </section>
      <section id="full-screen-wrapper" data-cols="1" data-gap="content">
        <h2>FullScreenWrapper</h2>
        <FullScreenWrapperDemo />
      </section>
      <section id="grid-area-select" data-cols="1" data-gap="content">
        <h2>GridAreaSelect</h2>
        <GridAreaSelectDemo />
      </section>
      <section id="grid-cell" data-cols="1" data-gap="content">
        <h2>GridCell</h2>
        <GridCellDemo />
      </section>
      <section id="grid-designer" data-cols="1" data-gap="content">
        <h2>GridDesigner</h2>
        <GridDesignerDemo />
      </section>
      <section id="grid-layout-display" data-cols="1" data-gap="content">
        <h2>GridLayoutDisplay</h2>
        <GridLayoutDisplayDemo />
      </section>
      <section id="help-icon" data-cols="1" data-gap="content">
        <h2>HelpIcon</h2>
        <HelpIconDemo />
      </section>
      <section id="login-box" data-cols="1" data-gap="content">
        <h2>LoginBox</h2>
        <LoginBoxDemo />
      </section>
      <section id="mcp-viewer" data-cols="1" data-gap="content">
        <h2>McpViewer</h2>
        <McpViewerDemo />
      </section>
      <section id="message-box" data-cols="1" data-gap="content">
        <h2>MessageBox</h2>
        <MessageBoxDemo />
      </section>
      <section id="modal" data-cols="1" data-gap="content">
        <h2>Modal</h2>
        <ModalDemo />
      </section>
      <section id="network-graph" data-cols="1" data-gap="content">
        <h2>NetworkGraph</h2>
        <NetworkGraphDemo />
      </section>
      <section id="pass-props" data-cols="1" data-gap="content">
        <h2>PassProps</h2>
        <PassPropsDemo />
      </section>
      <section id="popup" data-cols="1" data-gap="content">
        <h2>Popup</h2>
        <PopupDemo />
      </section>
      <section id="progress-bar" data-cols="1" data-gap="content">
        <h2>ProgressBar</h2>
        <ProgressBarDemo />
      </section>
      <section id="rabbit-head" data-cols="1" data-gap="content">
        <h2>RabbitHead</h2>
        <RabbitHeadDemo />
      </section>
      <section id="searchable-select" data-cols="1" data-gap="content">
        <h2>SearchableSelect</h2>
        <SearchableSelectDemo />
      </section>
      <section id="search-bar" data-cols="1" data-gap="content">
        <h2>SearchBar</h2>
        <SearchBarDemo />
      </section>
      <section id="search-responses" data-cols="1" data-gap="content">
        <h2>SearchResponses</h2>
        <SearchResponsesDemo />
      </section>
      <section id="site-nav" data-cols="1" data-gap="content">
        <h2>SiteNav</h2>
        <SiteNavDemo />
      </section>
      <section id="slider" data-cols="1" data-gap="content">
        <h2>Slider</h2>
        <SliderDemo />
      </section>
      <section id="smart-tooltip" data-cols="1" data-gap="content">
        <h2>SmartTooltip</h2>
        <SmartTooltipDemo />
      </section>
      <section id="star-ranking" data-cols="1" data-gap="content">
        <h2>StarRanking</h2>
        <StarRankingDemo />
      </section>
      <section id="stat-cells" data-cols="1" data-gap="content">
        <h2>StatCells</h2>
        <StatCellsDemo />
      </section>
      <section id="status-bar" data-cols="1" data-gap="content">
        <h2>StatusBar</h2>
        <StatusBarDemo />
      </section>
      <section id="tab-nav" data-cols="1" data-gap="content">
        <h2>TabNav</h2>
        <TabNavDemo />
      </section>
      <section id="stylers" data-cols="1" data-gap="content">
        <h2>Stylers</h2>
        <StylersDemo />
      </section>
      <section id="factory-json" data-cols="1" data-gap="content">
        <h2>Factory JSON composition</h2>
        <FactoryDemo />
      </section>
      <section id="test-component" data-cols="1" data-gap="content">
        <h2>TestComponent</h2>
        <TestComponentDemo />
      </section>
      <section id="toggle-group" data-cols="1" data-gap="content">
        <h2>ToggleGroup</h2>
        <ToggleGroupDemo />
      </section>
      <section id="toggle-section" data-cols="1" data-gap="content">
        <h2>ToggleSection</h2>
        <ToggleSectionDemo />
      </section>
      <section id="tooltip" data-cols="1" data-gap="content">
        <h2>Tooltip</h2>
        <TooltipDemo />
      </section>
      <section id="ui-elements" data-cols="1" data-gap="content">
        <h2>UiElements</h2>
        <UiElementsDemo />
      </section>
      <section id="word-graphs" data-cols="1" data-gap="content">
        <h2>WordGraphs</h2>
        <WordGraphsDemo />
      </section>
      <section id="world-components" data-cols="1" data-gap="content">
        <h2>WorldComponents</h2>
        <WorldComponentsDemo />
      </section>
    </div>
  );
};
