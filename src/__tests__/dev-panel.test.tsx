/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DevPanel from "@/app/dev/page";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockAuthCheck(authenticated: boolean) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ authenticated }),
  });
}

describe("DevPanel", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("shows login form when not authenticated", async () => {
    mockAuthCheck(false);
    render(<DevPanel />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/senha de desenvolvedor/i)).toBeInTheDocument();
    });
  });

  it("shows the panel when authenticated", async () => {
    mockAuthCheck(true);
    render(<DevPanel />);
    await waitFor(() => {
      expect(screen.getByText(/Nova instrução/i)).toBeInTheDocument();
    });
  });

  it("login calls auth API and shows panel on success", async () => {
    mockAuthCheck(false);
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) }); // login
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ commits: [] }) }); // git

    render(<DevPanel />);
    await waitFor(() => screen.getByPlaceholderText(/senha de desenvolvedor/i));

    fireEvent.change(screen.getByPlaceholderText(/senha de desenvolvedor/i), {
      target: { value: "mypassword" },
    });
    fireEvent.click(screen.getByText("Entrar"));

    await waitFor(() => {
      expect(screen.getByText(/Nova instrução/i)).toBeInTheDocument();
    });
  });

  it("shows error on invalid login", async () => {
    mockAuthCheck(false);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Invalid password" }),
    });

    render(<DevPanel />);
    await waitFor(() => screen.getByPlaceholderText(/senha de desenvolvedor/i));

    fireEvent.change(screen.getByPlaceholderText(/senha de desenvolvedor/i), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByText("Entrar"));

    await waitFor(() => {
      expect(screen.getByText("Invalid password")).toBeInTheDocument();
    });
  });
});
