import { MessageBox } from "../../MessageBox/MessageBox";
import type { SearchMessageBoxProps } from "./SearchMessageBox.types";

export const SearchMessageBox = (props: SearchMessageBoxProps) => {
  return (
    <MessageBox
      {...props}
      className={["search-message-box", props.className]
        .filter(Boolean)
        .join(" ")}
    />
  );
};
