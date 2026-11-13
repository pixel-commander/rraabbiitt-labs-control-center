import { Modal } from "../Modal";
import { useState } from "react";

export const Demo = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className='demo container-demos'>
      <button type="button" className="action-main" onClick={() => setOpen(true)}>Open modal</button>
      <Modal
        open={open}
        title={<strong>Example modal</strong>}
        footer={<button type="button" className="action-main" onClick={() => setOpen(false)}>Done</button>}
        handleClick={(_, action) => { if (action === "close-modal") setOpen(false); }}
      >
        <p>A centered dialog with a title, content, and footer.</p>
        <p>Press Escape, click the backdrop, or use Close or Done to dismiss it.</p>
      </Modal>
    </div>
  )
};
