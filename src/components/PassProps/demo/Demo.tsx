import { PassProps } from "../PassProps";

const Receiver = (props: Record<string, unknown>) => {
  return <pre>{JSON.stringify(props, null, 2)}</pre>;
};

export const Demo = () => {
  return (
    <PassProps
      name="Receiver demo"
      title="Props from PassProps"
      count={0}
      enabled={false}
      label=""
      settings={{ theme: "dark", nested: { works: true } }}
    >
      <Receiver />
    </PassProps>
  );
};
