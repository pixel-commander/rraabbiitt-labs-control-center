import { useState } from "react";
import { SearchBar } from "../SearchBar";

export const Demo = () => {
  const [state, setState] = useState({
    search: "",
    submitted: null as string | null,
  });
  return (
    <div>
      <SearchBar
        handleChange={(data) => {
          if (data)
            setState((previous) => ({ ...previous, search: data.search }));
        }}
        handleSubmit={(data) => {
          if (data)
            setState((previous) => ({ ...previous, submitted: data.search }));
        }}
      />
      <p>Current input: {state.search || "(empty)"}</p>
      <p role="status">
        {state.submitted === null
          ? "Submit a search to see its value."
          : `Submitted: ${state.submitted || "(empty)"}`}
      </p>
    </div>
  );
};
