import type { HouseKeys, HandlerKey } from "../../HouseKeys.types";
export type LoginView = "login" | "create";
export type LoginAction = LoginView | "google";
export interface LoginData extends HouseKeys {
  email?: string;
  password?: string;
}
export interface LoginBoxProps extends HouseKeys {
  className?: string;
  container_class?: string;
  action_class?: string;
  input_class?: string;
  selected?: LoginView;
  disabled?: boolean;
  status?: string;
  is_busy?: boolean;
  handleSelect?: HandlerKey<LoginView, "login-view", void, LoginBoxProps>;
  handleSubmit?: HandlerKey<
    LoginData,
    LoginAction,
    void | Promise<void>,
    LoginBoxProps
  >;
}
