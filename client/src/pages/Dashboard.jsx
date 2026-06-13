import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import StatsGrid from '../components/StatsGrid';
import ProjectOverview from '../components/ProjectOverview';
import CreateProjectDialog from '../components/CreateProjectDialog';
import ActivityFeed from '../components/ActivityFeed';
import TasksSummary from '../components/TasksSummary';
import { deleteWorkspace } from '../api/workspaceApi';
import { getWorkspaceActivities } from '../api/activityApi';
import { useDispatch, useSelector } from 'react-redux';
import { deleteWorkspace as deleteWorkspaceAction } from '../features/workspaceSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { workspaces, currentWorkspace } = useSelector((state) => state.workspace);
  const user = useSelector((state) => state.auth.user);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!currentWorkspace?._id) return;
      setLoadingActivities(true);
      try {
        const data = await getWorkspaceActivities(currentWorkspace._id);
        setActivities(data.activities);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingActivities(false);
      }
    };
    fetchActivities();
  }, [currentWorkspace?._id]);

  const handleDeleteWorkspace = async (workspaceId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this workspace?');
    if (!confirmDelete) return;
    try {
      await deleteWorkspace(workspaceId);
      dispatch(deleteWorkspaceAction(workspaceId));
    } catch (error) {
      console.error(error);
    }
  };

  if (!currentWorkspace) return (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-3 text-zinc-500 dark:text-zinc-400">
        <svg className="size-8 text-blue-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <p className="text-sm">Loading workspace...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
            Welcome back, {user?.name || 'User'}
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm">
            Here's what's happening with your projects today
          </p>
        </div>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center gap-2 px-5 py-2 text-sm rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:opacity-90 transition"
        >
          <Plus size={16} /> New Project
        </button>
        <CreateProjectDialog isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
      </div>

      {/* Stats */}
      <StatsGrid />

      {/* Workspaces */}
     

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <ProjectOverview />
        </div>
        <div className="space-y-8">
          <TasksSummary />
        
        </div>
      </div>
    </div>
  );
};

export default Dashboard;