"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = "http://127.0.0.1:8000";

export default function StudentDashboard() {
  const router = useRouter();

  const [tickets, setTickets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "other",
    priority: "medium",
  });

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  const loadTickets = async () => {
    try {
      const response = await fetch(`${API}/tickets`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        router.push("/");
        return;
      }

      const data = await response.json();
      setTickets(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      router.push("/");
      return;
    }

    loadTickets();
  }, []);

  const createTicket = async (e) => {
    e.preventDefault();

    const response = await fetch(`${API}/tickets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      alert("Failed to create ticket");
      return;
    }

    setForm({
      title: "",
      description: "",
      category: "other",
      priority: "medium",
    });

    setShowForm(false);
    loadTickets();
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Student Support
            </h1>
            <p className="text-sm text-slate-500">
              Manage your support tickets
            </p>
          </div>

          <button
            onClick={logout}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Top section */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              My Tickets
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Track your support requests
            </p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            + Create Ticket
          </button>
        </div>

        {/* Create ticket form */}
        {showForm && (
          <form
            onSubmit={createTicket}
            className="bg-white rounded-xl shadow-sm p-6 mb-6"
          >
            <h3 className="text-lg font-semibold mb-4">
              Create Support Ticket
            </h3>

            <div className="space-y-4">
              <input
                required
                placeholder="Ticket title"
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
              />

              <textarea
                required
                placeholder="Describe your issue"
                rows="4"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
              />

              <div className="grid grid-cols-2 gap-4">
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="border rounded-lg px-3 py-2"
                >
                  <option value="fee">Fee</option>
                  <option value="attendance">Attendance</option>
                  <option value="id_card">ID Card</option>
                  <option value="documents">Documents</option>
                  <option value="certificate">Certificate</option>
                  <option value="other">Other</option>
                </select>

                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.value })
                  }
                  className="border rounded-lg px-3 py-2"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Submit Ticket
                </button>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="border px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tickets */}
        {loading ? (
          <p className="text-slate-500">Loading tickets...</p>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center">
            <p className="text-slate-500">
              You haven't created any tickets yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white rounded-xl shadow-sm p-5"
              >
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      #{ticket.id} — {ticket.title}
                    </h3>

                    <p className="text-sm text-slate-500 mt-1">
                      {ticket.category}
                    </p>
                  </div>

                  <span className="text-sm font-medium capitalize">
                    {ticket.status.replace("_", " ")}
                  </span>
                </div>

                <p className="text-sm text-slate-600 mt-3">
                  {ticket.description}
                </p>

                <div className="flex gap-6 mt-4 text-sm text-slate-500">
                  <span>
                    Priority:{" "}
                    <strong className="capitalize">
                      {ticket.priority}
                    </strong>
                  </span>

                  <span>
                    Ageing: <strong>{ticket.ageing_hours}h</strong>
                  </span>

                  {ticket.due_at && (
                    <span>
                      SLA Due:{" "}
                      <strong>
                        {new Date(ticket.due_at).toLocaleString()}
                      </strong>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}