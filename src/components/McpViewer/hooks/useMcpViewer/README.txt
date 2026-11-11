useMcpViewer

No inputs. Owns open, rect, connection status, opener/window refs and handlers
used by the prop-free McpViewer. Preserves geometry across close/reopen.
Health is checked on mount and every 30 seconds with a two-second timeout.
Abort and interval cleanup run on unmount. Closing restores opener focus.
