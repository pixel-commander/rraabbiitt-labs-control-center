import "../grid-dashboard.css";

export const Demo = () => {
  return (
    <div className="atom-demo" data-grid="grid-dashboard">
      <div data-area="main-nav">main-nav</div>
      <div data-area="side-nav">side-nav</div>
      <div data-area="left">left</div>
      <div data-area="tabs-nav">tabs-nav</div>
      <div data-area="right">right</div>
      <div data-area="main">main</div>
      <div data-area="footer">footer</div>
    </div>
  );
};
