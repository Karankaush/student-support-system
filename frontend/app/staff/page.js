"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = "http://127.0.0.1:8000";

export default function StaffDashboard() {
  const router = useRouter();

  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activities, setActivities] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(null);

  const [updateForm, setUpdateForm] = useState({
    status: "",
    priority: "",
    resolution: "",
  });

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  useEffect(() => {
    if (!token) {
      router.push("/");
      return;
    }

    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (!storedUser || storedUser.role !== "staff") {
      router.push("/");
      return;
    }

    setUser(storedUser);
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);

    const params = new URLSearchParams();

    if (statusFilter) {
      params.append("status_filter", statusFilter);
    }

    if (priorityFilter) {
      params.append("priority", priorityFilter);
    }

    const response = await fetch(
      `${API}/tickets?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 401) {
      router.push("/");
      return;
    }

    const data = await response.json();
    setTickets(data);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadTickets();
    }
  }, [statusFilter, priorityFilter]);

  const selectTicket = async (ticket) => {
    setSelectedTicket(ticket);

    setUpdateForm({
      status: ticket.status,
      priority: ticket.priority,
      resolution: ticket.resolution || "",
    });

    const response = await fetch(
      `${API}/tickets/${ticket.id}/activities`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    setActivities(data);
  };

  const assignToMe = async () => {
    if (!selectedTicket || !user) return;

    await fetch(
      `${API}/tickets/${selectedTicket.id}/assign`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          staff_id: user.id,
        }),
      }
    );

    await refreshSelectedTicket();
  };

  const updateTicket = async (e) => {
    e.preventDefault();

    await fetch(`${API}/tickets/${selectedTicket.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status: updateForm.status,
        priority: updateForm.priority,
        resolution: updateForm.resolution || null,
      }),
    });

    await refreshSelectedTicket();
  };

  const refreshSelectedTicket = async () => {
    const response = await fetch(
      `${API}/tickets/${selectedTicket.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const updated = await response.json();

    setSelectedTicket(updated);

    setUpdateForm({
      status: updated.status,
      priority: updated.priority,
      resolution: updated.resolution || "",
    });

    const activityResponse = await fetch(
      `${API}/tickets/${updated.id}/activities`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setActivities(await activityResponse.json());

    loadTickets();
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const statusCounts = {
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    pending: tickets.filter((t) => t.status === "pending").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    closed: tickets.filter((t) => t.status === "closed").length,
  };

  return (
    <main className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between">
          <div>
            <h1 className="text-xl font-bold">
              Support Management
            </h1>

            <p className="text-sm text-slate-500">
              Staff Dashboard
            </p>
          </div>

          <button
            onClick={logout}
            className="text-red-600 text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {Object.entries(statusCounts).map(
            ([status, count]) => (
              <div
                key={status}
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                <p className="text-sm text-slate-500 capitalize">
                  {status.replace("_", " ")}
                </p>

                <p className="text-2xl font-bold mt-1">
                  {count}
                </p>
              </div>
            )
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 mb-6 flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">

          {/* Ticket list */}
          <div>
            <h2 className="text-xl font-bold mb-4">
              Tickets
            </h2>

            {loading ? (
              <p>Loading...</p>
            ) : tickets.length === 0 ? (
              <div className="bg-white rounded-xl p-6">
                No tickets found.
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => selectTicket(ticket)}
                    className={`w-full text-left bg-white rounded-xl p-5 shadow-sm border-2 ${
                      selectedTicket?.id === ticket.id
                        ? "border-blue-500"
                        : "border-transparent"
                    }`}
                  >
                    <div className="flex justify-between">
                      <h3 className="font-semibold">
                        #{ticket.id} — {ticket.title}
                      </h3>

                      <span className="text-sm capitalize">
                        {ticket.priority}
                      </span>
                    </div>

                    <p className="text-sm text-slate-500 mt-2">
                      {ticket.category}
                    </p>

                    <div className="flex gap-4 mt-3 text-sm">
                      <span className="capitalize">
                        {ticket.status.replace("_", " ")}
                      </span>

                      <span>
                        Age: {ticket.ageing_hours}h
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ticket detail */}
          <div>
            <h2 className="text-xl font-bold mb-4">
              Ticket Details
            </h2>

            {!selectedTicket ? (
              <div className="bg-white rounded-xl p-8 text-center text-slate-500">
                Select a ticket to manage it.
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 shadow-sm">

                <h3 className="text-xl font-bold">
                  #{selectedTicket.id} —{" "}
                  {selectedTicket.title}
                </h3>

                <p className="text-slate-600 mt-3">
                  {selectedTicket.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mt-5 text-sm">
                  <div>
                    <span className="text-slate-500">
                      Category
                    </span>
                    <p className="font-medium capitalize">
                      {selectedTicket.category}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500">
                      Ageing
                    </span>
                    <p className="font-medium">
                      {selectedTicket.ageing_hours} hours
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500">
                      Assigned To
                    </span>
                    <p className="font-medium">
                      {selectedTicket.assigned_to
                        ? `Staff #${selectedTicket.assigned_to}`
                        : "Unassigned"}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500">
                      SLA Due
                    </span>
                    <p className="font-medium">
                      {selectedTicket.due_at
                        ? new Date(
                            selectedTicket.due_at
                          ).toLocaleString()
                        : "—"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={assignToMe}
                  className="mt-5 bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Assign to Me
                </button>

                {/* Update */}
                <form
                  onSubmit={updateTicket}
                  className="mt-6 space-y-4 border-t pt-6"
                >
                  <div>
                    <label className="text-sm font-medium">
                      Status
                    </label>

                    <select
                      value={updateForm.status}
                      onChange={(e) =>
                        setUpdateForm({
                          ...updateForm,
                          status: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2 mt-1"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">
                        In Progress
                      </option>
                      <option value="pending">Pending</option>
                      <option value="resolved">
                        Resolved
                      </option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Priority
                    </label>

                    <select
                      value={updateForm.priority}
                      onChange={(e) =>
                        setUpdateForm({
                          ...updateForm,
                          priority: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2 mt-1"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Resolution
                    </label>

                    <textarea
                      rows="3"
                      value={updateForm.resolution}
                      onChange={(e) =>
                        setUpdateForm({
                          ...updateForm,
                          resolution: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2 mt-1"
                      placeholder="Add resolution details..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg"
                  >
                    Update Ticket
                  </button>
                </form>

                {/* Activity */}
                <div className="mt-8 border-t pt-6">
                  <h3 className="font-semibold mb-3">
                    Activity History
                  </h3>

                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="text-sm border-l-2 border-slate-300 pl-3"
                      >
                        <p>{activity.action}</p>

                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(
                            activity.created_at
                          ).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}