import "../grid-dashboard-alt.css";

export const Demo = () => {
  return (
    <div className="atom-demo" data-grid="grid-dashboard-alt">
      <div data-area="main-nav">main-nav</div>
      <div data-area="side-nav">side-nav</div>
      <div data-area="left">left</div>
      <div data-area="right">right</div>
      <div data-area="main">main</div>
      <div data-area="footer">footer</div>
    </div>
  );
};
