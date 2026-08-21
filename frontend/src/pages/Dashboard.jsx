import { useEffect, useState } from "react";
import API from "../api";

function Dashboard() {
  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const [tasks, setTasks] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [error, setError] = useState("");

  const fetchTasks = async () => {
    try {
      const response = await API.get("/tasks");
      setTasks(response.data);
    } catch (error) {
      setError("Failed to load tasks");
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const generateTasks = async () => {
    if (!aiInput.trim()) return;

    try {
      setLoadingAI(true);
      setError("");

      const response = await API.post(
        "/ai/generate-tasks",
        {
          input: aiInput,
        }
      );

      setGeneratedTasks(response.data.tasks);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to generate tasks"
      );
    } finally {
      setLoadingAI(false);
    }
  };

  const updateGeneratedTask = (
    index,
    field,
    value
  ) => {
    const updated = [...generatedTasks];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setGeneratedTasks(updated);
  };

  const deleteGeneratedTask = (index) => {
    setGeneratedTasks(
      generatedTasks.filter(
        (_, taskIndex) => taskIndex !== index
      )
    );
  };

  const saveGeneratedTasks = async () => {
    try {
      setLoadingTasks(true);
      setError("");

      for (const task of generatedTasks) {
        await API.post("/tasks", task);
      }

      setGeneratedTasks([]);
      setAiInput("");

      await fetchTasks();
    } catch (error) {
      setError("Failed to save generated tasks");
    } finally {
      setLoadingTasks(false);
    }
  };

  const toggleTask = async (task) => {
    try {
      await API.patch(
        `/tasks/${task._id}/complete`
      );

      fetchTasks();
    } catch (error) {
      setError("Failed to update task");
    }
  };

  const deleteTask = async (id) => {
    try {
      await API.delete(`/tasks/${id}`);

      fetchTasks();
    } catch (error) {
      setError("Failed to delete task");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";
  };

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  const pendingTasks = tasks.filter(
    (task) => task.status === "pending"
  ).length;

  const highPriorityTasks = tasks.filter(
    (task) => task.priority === "High"
  ).length;

  return (
    <div className="dashboard">
      <header className="navbar">
        <div>
          <h2>AI Task Assistant</h2>
        </div>

        <div className="navbar-right">
          <span>
            {user.name || "User"}
          </span>

          <button
            className="logout-btn"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="welcome">
          <h1>
            Welcome back, {user.name || "User"} 👋
          </h1>

          <p>
            Turn your thoughts into organized tasks.
          </p>
        </section>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {/* Statistics */}
        <section className="stats">
          <div className="stat-card">
            <span>Total Tasks</span>
            <strong>{totalTasks}</strong>
          </div>

          <div className="stat-card">
            <span>Completed</span>
            <strong>{completedTasks}</strong>
          </div>

          <div className="stat-card">
            <span>Pending</span>
            <strong>{pendingTasks}</strong>
          </div>

          <div className="stat-card">
            <span>High Priority</span>
            <strong>{highPriorityTasks}</strong>
          </div>
        </section>

        {/* AI Generator */}
        <section className="ai-section">
          <h2>🤖 AI Task Generator</h2>

          <p>
            Describe what you need to do in normal
            language.
          </p>

          <textarea
            value={aiInput}
            onChange={(e) =>
              setAiInput(e.target.value)
            }
            placeholder="Example: I need to prepare the presentation tomorrow, review the monthly report and send an email to the operations team."
          />

          <button
            onClick={generateTasks}
            disabled={loadingAI}
          >
            {loadingAI
              ? "Generating..."
              : "✨ Generate Tasks"}
          </button>
        </section>

        {/* Generated Tasks */}
        {generatedTasks.length > 0 && (
          <section className="generated-section">
            <div className="section-header">
              <div>
                <h2>Generated Tasks</h2>

                <p>
                  Review and edit before saving.
                </p>
              </div>

              <button
                onClick={saveGeneratedTasks}
                disabled={loadingTasks}
              >
                {loadingTasks
                  ? "Saving..."
                  : "Save All Tasks"}
              </button>
            </div>

            {generatedTasks.map(
              (task, index) => (
                <div
                  className="generated-task"
                  key={index}
                >
                  <input
                    type="text"
                    value={task.title}
                    onChange={(e) =>
                      updateGeneratedTask(
                        index,
                        "title",
                        e.target.value
                      )
                    }
                  />

                  <textarea
                    value={
                      task.description || ""
                    }
                    onChange={(e) =>
                      updateGeneratedTask(
                        index,
                        "description",
                        e.target.value
                      )
                    }
                  />

                  <div className="task-options">
                    <select
                      value={task.priority}
                      onChange={(e) =>
                        updateGeneratedTask(
                          index,
                          "priority",
                          e.target.value
                        )
                      }
                    >
                      <option value="Low">
                        Low
                      </option>

                      <option value="Medium">
                        Medium
                      </option>

                      <option value="High">
                        High
                      </option>
                    </select>

                    <input
                      type="date"
                      value={
                        task.dueDate || ""
                      }
                      onChange={(e) =>
                        updateGeneratedTask(
                          index,
                          "dueDate",
                          e.target.value || null
                        )
                      }
                    />

                    <button
                      className="delete-btn"
                      onClick={() =>
                        deleteGeneratedTask(
                          index
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            )}
          </section>
        )}

        {/* Existing Tasks */}
        <section className="tasks-section">
          <div className="section-header">
            <div>
              <h2>My Tasks</h2>

              <p>
                Manage your saved tasks.
              </p>
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="empty">
              No tasks yet. Generate your first
              task with AI.
            </div>
          ) : (
            tasks.map((task) => (
              <div
                className={`task-item ${
                  task.status === "completed"
                    ? "completed"
                    : ""
                }`}
                key={task._id}
              >
                <input
                  type="checkbox"
                  checked={
                    task.status === "completed"
                  }
                  onChange={() =>
                    toggleTask(task)
                  }
                />

                <div className="task-info">
                  <h3>{task.title}</h3>

                  <p>
                    {task.description}
                  </p>

                  <div className="task-meta">
                    <span
                      className={`priority ${task.priority.toLowerCase()}`}
                    >
                      {task.priority}
                    </span>

                    {task.dueDate && (
                      <span>
                        Due:{" "}
                        {new Date(
                          task.dueDate
                        ).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  className="delete-btn"
                  onClick={() =>
                    deleteTask(task._id)
                  }
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;