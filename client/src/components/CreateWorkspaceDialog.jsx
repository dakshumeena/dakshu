import { useState } from "react";
import { createWorkspace, getWorkspaces } from "../api/workspaceApi";
import { X, Building2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { setWorkspaces } from "../features/workspaceSlice";
import { useNavigate } from "react-router-dom";

const CreateWorkspaceDialog = ({ isOpen, onClose }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleCreateWorkspace = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    setError("");
    try {
      const data = await createWorkspace({ name, description });
      // Refetch full workspace list so currentWorkspace has projects/members populated correctly
      const refreshed = await getWorkspaces();
      dispatch(setWorkspaces(refreshed.workspaces));

      // Set the newly created workspace as current
      localStorage.setItem("currentWorkspaceId", data.workspace._id);
      const found = refreshed.workspaces.find((w) => w._id === data.workspace._id);
      if (found) {
        dispatch({ type: "workspace/setCurrentWorkspace", payload: found._id });
      }

      setName("");
      setDescription("");
      onClose();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create workspace");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800">

        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100">
              <Building2 size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create Workspace
              </h2>
              <p className="text-sm text-gray-500">
                Create a new workspace for your team
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div>
            <label className="block text-sm font-medium mb-2">Workspace Name</label>
            <input
              type="text"
              placeholder="e.g. Development Team"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              rows="4"
              placeholder="Describe your workspace..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-zinc-800">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-100 transition">
            Cancel
          </button>
          <button
            onClick={handleCreateWorkspace}
            disabled={isSubmitting || !name.trim()}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Workspace"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreateWorkspaceDialog;