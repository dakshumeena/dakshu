import { useState } from "react";
import { Mail, UserPlus } from "lucide-react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import API from "../api/axios";
import toast from "react-hot-toast";

const AddProjectMember = ({ isDialogOpen, setIsDialogOpen }) => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace || null);
  const project = currentWorkspace?.projects?.find((p) => p._id === id);
  const projectMembersEmails = project?.members?.map((m) => m.user?.email) || [];

  const [email, setEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !id) return;
    setIsAdding(true);
    try {
      await API.post(`/projects/${id}/members`, { email });
      toast.success("Invitation email sent!");
      setIsDialogOpen(false);
      setEmail("");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send invitation");
    } finally {
      setIsAdding(false);
    }
  };

  if (!isDialogOpen) return null;

  const availableMembers = currentWorkspace?.members?.filter(
    (m) => !projectMembersEmails.includes(m.user?.email)
  ) || [];

  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl p-6 w-full max-w-md text-zinc-900 dark:text-zinc-200">
        <div className="mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UserPlus className="size-5" /> Invite Member to Project
          </h2>
          {project && (
            <p className="text-sm text-zinc-700 dark:text-zinc-400">
              Inviting to:{" "}
              <span className="text-blue-600 dark:text-blue-400">{project.name}</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 w-4 h-4" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="pl-10 mt-1 w-full rounded border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-200 text-sm placeholder-zinc-400 py-2 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            {availableMembers.length > 0 && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Or pick an existing workspace member:
              </p>
            )}
            {availableMembers.length > 0 && (
              <select
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-200 text-sm py-2 px-2 focus:outline-none focus:border-blue-500"
              >
                <option value="">Select existing member</option>
                {availableMembers.map((member) => (
                  <option key={member.user?._id} value={member.user?.email}>
                    {member.user?.name} ({member.user?.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsDialogOpen(false)}
              className="px-5 py-2 text-sm rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAdding || !email}
              className="px-5 py-2 text-sm rounded bg-gradient-to-br from-blue-500 to-blue-600 hover:opacity-90 text-white disabled:opacity-50 transition"
            >
              {isAdding ? "Sending..." : "Send Invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProjectMember;