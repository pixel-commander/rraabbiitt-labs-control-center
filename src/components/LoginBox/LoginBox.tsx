import type { LoginBoxProps, LoginView, LoginData } from "./LoginBox.types";
import "../../atoms/actions/action-main/action-main.css";
import "../../atoms/containers/container-cell/container-cell.css";
import "./css/login-box.css";
export const LoginBox = (props: LoginBoxProps) => {
  const {
    selected = "login",
    className = "",
    container_class = "container-cell",
    action_class = "action-main",
    input_class = "",
    disabled = false,
    is_busy = false,
    status,
  } = props;
  return (
    <section
      className={["login-box", container_class, className]
        .filter(Boolean)
        .join(" ")}
      data-cols="1"
      aria-busy={is_busy}
    >
      <header>
        <h2>{selected === "login" ? "Sign in" : "Create account"}</h2>
        <p>
          {selected === "login"
            ? "Welcome back — log in to continue."
            : "Create your account."}
        </p>
      </header>
      {(["login", "create"] as LoginView[]).map((view) => (
        <div key={view} hidden={selected !== view}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const values = new FormData(e.currentTarget);
              const data: LoginData = {
                email: String(values.get("email") ?? ""),
                password: String(values.get("password") ?? ""),
              };
              if (view === "create")
                data.name = String(values.get("name") ?? "");
              void props.handleSubmit?.(data, view, props);
            }}
          >
            <fieldset data-cols="1" disabled={disabled || is_busy}>
              {view === "create" && (
                <label>
                  Name
                  <input
                    className={input_class}
                    name="name"
                    autoComplete="name"
                    required
                  />
                </label>
              )}
              <label>
                Email
                <input
                  className={input_class}
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </label>
              <label>
                Password
                <input
                  className={input_class}
                  name="password"
                  type="password"
                  autoComplete={
                    view === "login" ? "current-password" : "new-password"
                  }
                  required
                />
              </label>
              <input
                className={action_class}
                type="submit"
                disabled={!props.handleSubmit}
                value={
                  is_busy
                    ? "Please wait…"
                    : view === "login"
                      ? "Log in"
                      : "Create account"
                }
              />
            </fieldset>
          </form>
        </div>
      ))}
      <div data-cols="1" className="login-box__actions">
        <button
          type="button"
          className={action_class}
          disabled={disabled || is_busy || !props.handleSelect}
          onClick={() =>
            props.handleSelect?.(
              selected === "login" ? "create" : "login",
              "login-view",
              props,
            )
          }
        >
          {selected === "login" ? "Create account" : "Have an account? Log in"}
        </button>
        {selected === "login" && (
          <button
            type="button"
            className={action_class}
            disabled={disabled || is_busy || !props.handleSubmit}
            onClick={() => {
              void props.handleSubmit?.({}, "google", props);
            }}
          >
            Log in with Google
          </button>
        )}
      </div>
      {status !== undefined && <output role="status">{status}</output>}
    </section>
  );
};
